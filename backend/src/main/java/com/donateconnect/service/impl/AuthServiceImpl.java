package com.donateconnect.service.impl;

import com.donateconnect.config.JwtUtils;
import com.donateconnect.dto.*;
import com.donateconnect.entity.Role;
import com.donateconnect.entity.User;
import com.donateconnect.exception.ResourceNotFoundException;
import com.donateconnect.repository.UserRepository;
import com.donateconnect.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.donateconnect.service.EmailService;
import com.donateconnect.repository.NGOProfileRepository;
import com.donateconnect.entity.NGOProfile;
import com.donateconnect.service.OtpRateLimitService;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final EmailService emailService;
    private final NGOProfileRepository ngoProfileRepository;
    private final OtpRateLimitService otpRateLimitService;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Enforce DONOR, VOLUNTEER, or NGO role for public self-registration
        Role requestedRole = request.getRole() != null ? request.getRole() : Role.DONOR;
        if (requestedRole != Role.DONOR && requestedRole != Role.VOLUNTEER && requestedRole != Role.NGO) {
            throw new IllegalArgumentException("Public registration is strictly restricted to DONOR, VOLUNTEER, or NGO roles.");
        }

        if (userRepository.existsByEmail(request.getEmail().toLowerCase())) {
            throw new IllegalArgumentException("Email address is already registered.");
        }

        User user = User.builder()
                .email(request.getEmail().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .role(requestedRole)
                .approved(requestedRole == Role.DONOR)
                .build();

        User savedUser = userRepository.save(user);

        // If NGO, create the NGO Profile
        if (requestedRole == Role.NGO) {
            if (request.getAddress() == null || request.getPhone() == null) {
                throw new IllegalArgumentException("Address and Phone are required for NGO registration.");
            }
            String lowerAddress = request.getAddress().toLowerCase();
            if (!lowerAddress.contains("bengaluru") && !lowerAddress.contains("bangalore")) {
                throw new IllegalArgumentException("We currently only accept NGOs operating in the Bengaluru region.");
            }
            NGOProfile ngoProfile = NGOProfile.builder()
                    .user(savedUser)
                    .name(request.getFullName().trim())
                    .description("")
                    .address(request.getAddress().trim())
                    .phone(request.getPhone().trim())
                    .verified(false)
                    .build();
            ngoProfileRepository.save(ngoProfile);
        } else if (request.getAddress() != null && !request.getAddress().trim().isEmpty()) {
            String lowerAddress = request.getAddress().toLowerCase();
            if (!lowerAddress.contains("bengaluru") && !lowerAddress.contains("bangalore")) {
                throw new IllegalArgumentException("We currently only operate in the Bengaluru region.");
            }
        }

        // Generate and save OTP
        String otp = String.format("%06d", new java.util.Random().nextInt(999999));
        savedUser.setOtp(otp);
        savedUser.setOtpExpiry(LocalDateTime.now().plusMinutes(5));
        userRepository.save(savedUser);

        // Send OTP email
        emailService.sendOtpEmail(savedUser.getEmail(), otp);

        return AuthResponse.builder()
                .token(null)
                .user(mapToDto(savedUser))
                .requiresOtp(true)
                .build();
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        if (!user.isApproved() && user.getRole() != Role.DONOR) {
            throw new BadCredentialsException("Account pending admin approval");
        }

        String token = jwtUtils.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .user(mapToDto(user))
                .requiresOtp(false)
                .build();
    }

    @Override
    @Transactional
    public AuthResponse verifyOtp(VerifyOtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or session expired"));

        if (user.getOtp() == null || user.getOtpExpiry() == null) {
            throw new BadCredentialsException("No active OTP session found");
        }

        if (LocalDateTime.now().isAfter(user.getOtpExpiry())) {
            user.setOtp(null);
            user.setOtpExpiry(null);
            user.setOtpAttempts(0);
            userRepository.save(user);
            throw new BadCredentialsException("OTP has expired. Please login again.");
        }

        if (user.getOtpAttempts() >= 3 || user.getTotalOtpAttempts() >= 10) {
            user.setOtp(null);
            user.setOtpExpiry(null);
            user.setOtpAttempts(0);
            userRepository.save(user);
            throw new BadCredentialsException("Too many invalid attempts. OTP revoked.");
        }

        if (!user.getOtp().equals(request.getOtp())) {
            user.setOtpAttempts(user.getOtpAttempts() + 1);
            user.setTotalOtpAttempts(user.getTotalOtpAttempts() + 1);
            userRepository.save(user);
            throw new BadCredentialsException("Invalid OTP code");
        }

        // Clear OTP
        user.setOtp(null);
        user.setOtpExpiry(null);
        user.setOtpAttempts(0);
        userRepository.save(user);

        String token = jwtUtils.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .user(mapToDto(user))
                .requiresOtp(false)
                .build();
    }

    @Override
    @Transactional
    public void resendOtp(String email, String clientIp) {
        if (otpRateLimitService.isIpRateLimited(clientIp)) {
            throw new IllegalArgumentException("Too many requests from this IP. Please try again later.");
        }

        User user = userRepository.findByEmail(email.toLowerCase().trim()).orElse(null);
        if (user == null) {
            return; // Generic response, do not reveal email exists
        }

        // 60s cooldown per account
        if (user.getLastOtpSentAt() != null && LocalDateTime.now().minusSeconds(60).isBefore(user.getLastOtpSentAt())) {
            throw new IllegalArgumentException("Please wait 60 seconds before requesting another OTP.");
        }

        // max 5 resends per hour per account
        if (user.getFirstOtpResendAt() == null || LocalDateTime.now().minusHours(1).isAfter(user.getFirstOtpResendAt())) {
            user.setFirstOtpResendAt(LocalDateTime.now());
            user.setOtpResendCount(0);
        }

        if (user.getOtpResendCount() >= 5) {
            throw new IllegalArgumentException("Maximum OTP resend limit reached for this hour. Please try again later.");
        }

        String otp = String.format("%06d", new java.util.Random().nextInt(999999));
        user.setOtp(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));
        user.setOtpAttempts(0);
        user.setLastOtpSentAt(LocalDateTime.now());
        user.setOtpResendCount(user.getOtpResendCount() + 1);
        userRepository.save(user);

        emailService.sendOtpEmail(user.getEmail(), otp);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponseDto getCurrentUser(String email) {
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found"));
        return mapToDto(user);
    }

    private UserResponseDto mapToDto(User user) {
        return UserResponseDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .averageRating(user.getAverageRating())
                .ratingCount(user.getRatingCount())
                .createdAt(user.getCreatedAt())
                .build();
    }
}

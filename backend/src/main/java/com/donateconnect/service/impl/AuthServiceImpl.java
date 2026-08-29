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
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final EmailService emailService;
    private final NGOProfileRepository ngoProfileRepository;

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
            NGOProfile ngoProfile = NGOProfile.builder()
                    .user(savedUser)
                    .name(request.getFullName().trim())
                    .description("")
                    .address(request.getAddress().trim())
                    .phone(request.getPhone().trim())
                    .verified(false)
                    .build();
            ngoProfileRepository.save(ngoProfile);
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
            userRepository.save(user);
            throw new BadCredentialsException("OTP has expired. Please login again.");
        }

        if (!user.getOtp().equals(request.getOtp())) {
            throw new BadCredentialsException("Invalid OTP code");
        }

        // Clear OTP
        user.setOtp(null);
        user.setOtpExpiry(null);
        userRepository.save(user);

        String token = jwtUtils.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .user(mapToDto(user))
                .requiresOtp(false)
                .build();
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
                .createdAt(user.getCreatedAt())
                .build();
    }
}

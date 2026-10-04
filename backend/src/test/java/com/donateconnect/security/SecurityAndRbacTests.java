package com.donateconnect.security;

import com.donateconnect.config.JwtUtils;
import com.donateconnect.dto.*;
import com.donateconnect.entity.Role;
import com.donateconnect.entity.User;
import com.donateconnect.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SecurityAndRbacTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @org.springframework.boot.test.mock.mockito.MockBean
    private com.donateconnect.service.EmailService emailService;

    private User donorUser;
    private User adminUser;
    private User ngoUser;
    private User volunteerUser;
    private User corporateUser;
    private String donorToken;
    private String adminToken;
    private String ngoToken;
    private String volunteerToken;

    @BeforeEach
    void setup() {
        donorUser = userRepository.save(User.builder()
                .email("donor@test.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .fullName("Test Donor")
                .role(Role.DONOR)
                .build());

        adminUser = userRepository.save(User.builder()
                .email("admin@test.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .fullName("Test Admin")
                .role(Role.ADMIN)
                .build());

        ngoUser = userRepository.save(User.builder()
                .email("ngo@test.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .fullName("Test NGO Manager")
                .role(Role.NGO)
                .build());

        volunteerUser = userRepository.save(User.builder()
                .email("volunteer@test.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .fullName("Test Volunteer")
                .role(Role.VOLUNTEER)
                .build());

        corporateUser = userRepository.save(User.builder()
                .email("corporate@test.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .fullName("Test Corporate")
                .role(Role.CORPORATE)
                .build());

        donorToken = jwtUtils.generateToken(donorUser);
        adminToken = jwtUtils.generateToken(adminUser);
        ngoToken = jwtUtils.generateToken(ngoUser);
        volunteerToken = jwtUtils.generateToken(volunteerUser);
    }

    // ==================== AUTHENTICATION TESTS ====================

    @Test
    void testSuccessfulDonorRegistration() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("newdonor@test.com")
                .password("password123")
                .fullName("New Donor")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.requiresOtp").value(true))
                .andExpect(jsonPath("$.data.user.role").value("DONOR"));
    }

    @Test
    void testRegistrationOtp_Success() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("otpdonor@test.com")
                .password("password123")
                .fullName("OTP Donor")
                .build();
        
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isAccepted());

        User user = userRepository.findByEmail("otpdonor@test.com").orElseThrow();
        String otp = user.getOtp();
        
        VerifyOtpRequest verifyRequest = VerifyOtpRequest.builder()
                .email("otpdonor@test.com")
                .otp(otp)
                .build();

        mockMvc.perform(post("/api/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").isNotEmpty());
    }

    @Test
    void testRegistrationOtp_WrongOtpRejected() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("wrongotp@test.com")
                .password("password123")
                .fullName("Wrong OTP Donor")
                .build();
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isAccepted());

        VerifyOtpRequest verifyRequest = VerifyOtpRequest.builder()
                .email("wrongotp@test.com")
                .otp("000000") // Assuming real OTP is random, this has 99.999% chance of being wrong
                .build();

        mockMvc.perform(post("/api/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testRegistrationOtp_ExpiredRejected() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("expiredotp@test.com")
                .password("password123")
                .fullName("Expired OTP Donor")
                .build();
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isAccepted());

        User user = userRepository.findByEmail("expiredotp@test.com").orElseThrow();
        user.setOtpExpiry(java.time.LocalDateTime.now().minusMinutes(1));
        userRepository.save(user);
        
        VerifyOtpRequest verifyRequest = VerifyOtpRequest.builder()
                .email("expiredotp@test.com")
                .otp(user.getOtp())
                .build();

        mockMvc.perform(post("/api/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testRegistrationOtp_AttemptLimit() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("limitotp@test.com")
                .password("password123")
                .fullName("Limit OTP Donor")
                .build();
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isAccepted());

        VerifyOtpRequest wrongRequest = VerifyOtpRequest.builder()
                .email("limitotp@test.com")
                .otp("000000")
                .build();

        // 3 wrong attempts
        mockMvc.perform(post("/api/auth/verify-otp").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(wrongRequest))).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/auth/verify-otp").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(wrongRequest))).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/auth/verify-otp").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(wrongRequest))).andExpect(status().isUnauthorized());

        // 4th attempt (even with correct OTP) should fail because revoked
        User user = userRepository.findByEmail("limitotp@test.com").orElseThrow();
        VerifyOtpRequest correctRequest = VerifyOtpRequest.builder()
                .email("limitotp@test.com")
                .otp(user.getOtp() == null ? "123456" : user.getOtp())
                .build();
        
        mockMvc.perform(post("/api/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(correctRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testRegistrationOtp_ResendInvalidatesPrevious() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("resendotp@test.com")
                .password("password123")
                .fullName("Resend OTP Donor")
                .build();
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isAccepted());

        User user = userRepository.findByEmail("resendotp@test.com").orElseThrow();
        String oldOtp = user.getOtp();

        // Resend
        mockMvc.perform(post("/api/auth/resend-otp?email=resendotp@test.com"))
                .andExpect(status().isOk());

        User updatedUser = userRepository.findByEmail("resendotp@test.com").orElseThrow();
        String newOtp = updatedUser.getOtp();

        // Verify old OTP fails
        VerifyOtpRequest oldRequest = VerifyOtpRequest.builder()
                .email("resendotp@test.com")
                .otp(oldOtp)
                .build();
        if (!oldOtp.equals(newOtp)) {
            mockMvc.perform(post("/api/auth/verify-otp")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(oldRequest)))
                    .andExpect(status().isUnauthorized());
        }

        // Verify new OTP works
        VerifyOtpRequest newRequest = VerifyOtpRequest.builder()
                .email("resendotp@test.com")
                .otp(newOtp)
                .build();
        mockMvc.perform(post("/api/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newRequest)))
                .andExpect(status().isOk());
    }

    @Test
    void testDuplicateEmailRegistration() throws Exception {
        // donorUser already created in @BeforeEach with email "donor@test.com"
        RegisterRequest request = RegisterRequest.builder()
                .email("donor@test.com")
                .password("password123")
                .fullName("Duplicate Donor")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testInvalidRegistrationData_MissingEmail() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("")
                .password("password123")
                .fullName("Test User")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testInvalidRegistrationData_ShortPassword() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("shortpwd@test.com")
                .password("123")
                .fullName("Test User")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testSuccessfulLogin() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("donor@test.com")
                .password("password123")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty());
    }

    @Test
    void testInvalidCredentials_WrongPassword() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("donor@test.com")
                .password("wrongpassword")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testInvalidCredentials_UnknownEmail() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("nonexistent@test.com")
                .password("password123")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testAccessAuthenticatedEndpoint_WithoutJwt() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testAccessAuthenticatedEndpoint_WithValidJwt() throws Exception {
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + donorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("donor@test.com"));
    }

    // ==================== RBAC TESTS ====================

    @Test
    void testDonorCannotAccessAdminEndpoints() throws Exception {
        mockMvc.perform(get("/api/admin/ngo")
                        .header("Authorization", "Bearer " + donorToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testNgoCannotAccessAdminEndpoints() throws Exception {
        mockMvc.perform(get("/api/admin/ngo")
                        .header("Authorization", "Bearer " + ngoToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testVolunteerCannotAccessAdminEndpoints() throws Exception {
        mockMvc.perform(get("/api/admin/ngo")
                        .header("Authorization", "Bearer " + volunteerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testDonorCannotAccessNgoManagementEndpoints() throws Exception {
        // /api/ngo/me/profile is NGO-only
        mockMvc.perform(get("/api/ngo/me/profile")
                        .header("Authorization", "Bearer " + donorToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testVolunteerCannotAccessNgoManagementEndpoints() throws Exception {
        mockMvc.perform(get("/api/ngo/me/profile")
                        .header("Authorization", "Bearer " + volunteerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testAdminCanAccessAdminEndpoints() throws Exception {
        mockMvc.perform(get("/api/admin/ngo")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    void testDonorCannotAccessVolunteerPickupEndpoints() throws Exception {
        mockMvc.perform(get("/api/volunteer/pickups")
                        .header("Authorization", "Bearer " + donorToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testInvalidJwtToken() throws Exception {
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer invalid.jwt.token"))
                .andExpect(status().isUnauthorized());
    }
}

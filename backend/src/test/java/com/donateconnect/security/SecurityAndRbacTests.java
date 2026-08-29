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
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.user.role").value("DONOR"));
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

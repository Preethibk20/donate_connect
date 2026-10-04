package com.donateconnect.security;

import com.donateconnect.config.JwtUtils;
import com.donateconnect.dto.CreateDonationRequest;
import com.donateconnect.entity.Category;
import com.donateconnect.entity.Donation;
import com.donateconnect.entity.DonationStatus;
import com.donateconnect.entity.NGOProfile;
import com.donateconnect.entity.Role;
import com.donateconnect.entity.User;
import com.donateconnect.repository.DonationRepository;
import com.donateconnect.repository.NGOProfileRepository;
import com.donateconnect.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.hamcrest.Matchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class RoleMatrixIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NGOProfileRepository ngoProfileRepository;

    @Autowired
    private DonationRepository donationRepository;

    @Autowired
    private com.donateconnect.repository.DeliveryRepository deliveryRepository;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private ObjectMapper objectMapper;

    private String donorToken, ngoAToken, ngoBToken, volunteerToken, adminToken;
    private User donorUser, ngoUserA, ngoUserB, volunteerUser, adminUser;
    private NGOProfile ngoA, ngoB;
    private Donation donationA;
    private com.donateconnect.entity.Delivery deliveryA;

    @Autowired(required = false)
    private com.donateconnect.config.DataInitializer dataInitializer;

    @org.springframework.beans.factory.annotation.Value("${app.jwt.secret}")
    private String jwtSecret;

    @BeforeEach
    void setup() {
        String uuid = java.util.UUID.randomUUID().toString();
        donorUser = saveUser("donor" + uuid + "@test.com", Role.DONOR);
        ngoUserA = saveUser("ngoa" + uuid + "@test.com", Role.NGO);
        ngoUserB = saveUser("ngob" + uuid + "@test.com", Role.NGO);
        volunteerUser = saveUser("volunteer" + uuid + "@test.com", Role.VOLUNTEER);
        adminUser = saveUser("admin" + uuid + "@test.com", Role.ADMIN);

        donorToken = jwtUtils.generateToken(donorUser);
        ngoAToken = jwtUtils.generateToken(ngoUserA);
        ngoBToken = jwtUtils.generateToken(ngoUserB);
        volunteerToken = jwtUtils.generateToken(volunteerUser);
        adminToken = jwtUtils.generateToken(adminUser);

        ngoA = ngoProfileRepository.save(NGOProfile.builder().user(ngoUserA).verified(true).name("NGO A").address("123 Bangalore St").phone("9876543210").build());
        ngoB = ngoProfileRepository.save(NGOProfile.builder().user(ngoUserB).verified(true).name("NGO B").address("123 Bangalore St").phone("9876543210").build());

        donationA = donationRepository.save(Donation.builder()
                .donor(donorUser)
                .ngo(ngoA)
                .category(Category.CLOTHES)
                .description("Test Donation A")
                .status(DonationStatus.PICKED_UP)
                .pickupAddress("123 Bangalore St")
                .pickupLat(12.9716)
                .pickupLng(77.5946)
                .build());

        deliveryA = deliveryRepository.save(com.donateconnect.entity.Delivery.builder()
                .donation(donationA)
                .volunteer(volunteerUser)
                .status(com.donateconnect.entity.DeliveryStatus.PICKED_UP)
                .assignedAt(java.time.LocalDateTime.now())
                .deliveryOtp("123456")
                .build());
    }

    private User saveUser(String prefix, Role role) {
        String email = prefix + "_" + java.util.UUID.randomUUID().toString() + "@test.com";
        return userRepository.save(User.builder().email(email).passwordHash("hash").fullName(role.name()).role(role).approved(true).build());
    }
    @Test
    void testNgoACannotReadDonationsOfNgoB_IDOR() throws Exception {
        // NGO B attempts to update NGO A's donation status.
        mockMvc.perform(patch("/api/ngo/donations/" + donationA.getId() + "/status")
                        .header("Authorization", "Bearer " + ngoBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"ACCEPTED\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void testDonorCanOnlySeeOwnDonations() throws Exception {
        mockMvc.perform(get("/api/donations/mine")
                        .header("Authorization", "Bearer " + donorToken))
                .andExpect(status().isOk());

        User otherDonor = saveUser("otherdonor", Role.DONOR);
        String otherDonorToken = jwtUtils.generateToken(otherDonor);

        // If they try to access a specific donation belonging to someone else
        mockMvc.perform(get("/api/donations/mine/" + donationA.getId())
                        .header("Authorization", "Bearer " + otherDonorToken))
                .andExpect(status().isNotFound()); // Or 404 since it's "not found or does not belong to you"
    }

    @Test
    void testOtpDoesNotAppearInResponseDto() throws Exception {
        String realOtp = deliveryRepository.findById(deliveryA.getId()).get().getDeliveryOtp();

        // OTP should not be visible when fetching donation details as a donor
        mockMvc.perform(get("/api/donations/mine/" + donationA.getId())
                        .header("Authorization", "Bearer " + donorToken))
                .andExpect(status().isOk())
                .andExpect(content().string(not(containsString(realOtp))));
                
        // Or when NGO fetches list of donations
        mockMvc.perform(get("/api/ngo/donations")
                        .header("Authorization", "Bearer " + ngoAToken))
                .andExpect(status().isOk())
                .andExpect(content().string(not(containsString(realOtp))));

        // Or when Volunteer fetches deliveries
        mockMvc.perform(get("/api/volunteer/deliveries/donation/" + donationA.getId())
                        .header("Authorization", "Bearer " + volunteerToken))
                .andExpect(status().isOk())
                .andExpect(content().string(not(containsString(realOtp))));
    }

    @Test
    void testExpiredJwtRejected() throws Exception {
        // Generate a real expired JWT
        java.util.Date now = new java.util.Date();
        java.util.Date past = new java.util.Date(now.getTime() - 10000); // 10 seconds ago
        javax.crypto.SecretKey key = io.jsonwebtoken.security.Keys.hmacShaKeyFor(jwtSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        
        String expiredToken = io.jsonwebtoken.Jwts.builder()
                .subject(donorUser.getEmail())
                .claim("userId", donorUser.getId().toString())
                .claim("role", donorUser.getRole().name())
                .issuedAt(past)
                .expiration(past)
                .signWith(key)
                .compact();
                
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testNgoACannotReadOtpOfNgoB_IDOR() throws Exception {
        String realOtp = deliveryRepository.findById(deliveryA.getId()).get().getDeliveryOtp();

        // Positive control: NGO A CAN read OTP of NGO A's delivery.
        mockMvc.perform(get("/api/volunteer/deliveries/donation/" + donationA.getId() + "/otp")
                        .header("Authorization", "Bearer " + ngoAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value(realOtp));

        // Negative control: NGO B attempts to read OTP of NGO A's delivery.
        mockMvc.perform(get("/api/volunteer/deliveries/donation/" + donationA.getId() + "/otp")
                        .header("Authorization", "Bearer " + ngoBToken))
                .andExpect(status().isForbidden()); // or 403 / AccessDenied
    }

    @Test
    void testSeedDataDoesNotLoadWhenAppSeedEnabledIsUnset() {
        org.junit.jupiter.api.Assertions.assertNull(dataInitializer, 
            "DataInitializer bean should not exist because app.seed.enabled is false in test profile");
    }
}

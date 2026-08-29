package com.donateconnect.service;

import com.donateconnect.config.JwtUtils;
import com.donateconnect.entity.*;
import com.donateconnect.repository.*;
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

import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class VolunteerWorkflowTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NGOProfileRepository ngoProfileRepository;

    @Autowired
    private DonationRepository donationRepository;

    @Autowired
    private VolunteerTaskRepository volunteerTaskRepository;

    @Autowired
    private StatusHistoryRepository statusHistoryRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User donorUser;
    private User ngoUser;
    private User volunteerUser;
    private User anotherVolunteerUser;
    private NGOProfile ngoProfile;
    private Donation acceptedDonation;
    private String volunteerToken;
    private String anotherVolunteerToken;
    private String donorToken;

    @BeforeEach
    void setup() {
        donorUser = userRepository.save(User.builder()
                .email("donor@voltest.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .fullName("Test Donor")
                .role(Role.DONOR)
                .build());

        ngoUser = userRepository.save(User.builder()
                .email("ngo@voltest.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .fullName("Test NGO Manager")
                .role(Role.NGO)
                .build());

        volunteerUser = userRepository.save(User.builder()
                .email("volunteer@voltest.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .fullName("Test Volunteer")
                .role(Role.VOLUNTEER)
                .build());

        anotherVolunteerUser = userRepository.save(User.builder()
                .email("anothervolunteer@voltest.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .fullName("Another Volunteer")
                .role(Role.VOLUNTEER)
                .build());

        ngoProfile = ngoProfileRepository.save(NGOProfile.builder()
                .user(ngoUser)
                .name("Test NGO")
                .description("Test NGO Description")
                .address("123 Test Street")
                .phone("1234567890")
                .verified(true)
                .build());

        acceptedDonation = donationRepository.save(Donation.builder()
                .donor(donorUser)
                .ngo(ngoProfile)
                .category(Category.CLOTHES)
                .description("Clothes for pickup")
                .status(DonationStatus.ACCEPTED)
                .pickupDate(LocalDate.now().plusDays(2))
                .build());

        volunteerToken = jwtUtils.generateToken(volunteerUser);
        anotherVolunteerToken = jwtUtils.generateToken(anotherVolunteerUser);
        donorToken = jwtUtils.generateToken(donorUser);
    }

    // ==================== AVAILABLE PICKUPS TESTS ====================

    @Test
    void testVolunteerCanListAvailablePickups() throws Exception {
        mockMvc.perform(get("/api/volunteer/pickups/available")
                        .header("Authorization", "Bearer " + volunteerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.content[*].status", everyItem(is("ACCEPTED"))));
    }

    @Test
    void testDonorCannotListAvailablePickups() throws Exception {
        mockMvc.perform(get("/api/volunteer/pickups/available")
                        .header("Authorization", "Bearer " + donorToken))
                .andExpect(status().isForbidden());
    }

    // ==================== CLAIM PICKUP TESTS ====================

    @Test
    void testVolunteerCanClaimPickup() throws Exception {
        mockMvc.perform(post("/api/volunteer/pickups/" + acceptedDonation.getId() + "/claim")
                        .header("Authorization", "Bearer " + volunteerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("CLAIMED"))
                .andExpect(jsonPath("$.data.volunteer.email").value("volunteer@voltest.com"));
    }

    @Test
    void testVolunteerCannotClaimSamePickupTwice() throws Exception {
        // First claim should succeed
        mockMvc.perform(post("/api/volunteer/pickups/" + acceptedDonation.getId() + "/claim")
                        .header("Authorization", "Bearer " + volunteerToken))
                .andExpect(status().isOk());

        // Second claim should fail
        mockMvc.perform(post("/api/volunteer/pickups/" + acceptedDonation.getId() + "/claim")
                        .header("Authorization", "Bearer " + volunteerToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testAnotherVolunteerCannotClaimAlreadyClaimedPickup() throws Exception {
        // First volunteer claims
        mockMvc.perform(post("/api/volunteer/pickups/" + acceptedDonation.getId() + "/claim")
                        .header("Authorization", "Bearer " + volunteerToken))
                .andExpect(status().isOk());

        // Second volunteer cannot claim the same
        mockMvc.perform(post("/api/volunteer/pickups/" + acceptedDonation.getId() + "/claim")
                        .header("Authorization", "Bearer " + anotherVolunteerToken))
                .andExpect(status().isBadRequest());
    }

    // ==================== STATUS TRANSITION TESTS ====================

    @Test
    void testVolunteerCanMarkInTransit() throws Exception {
        // First claim
        String claimResponse = mockMvc.perform(post("/api/volunteer/pickups/" + acceptedDonation.getId() + "/claim")
                        .header("Authorization", "Bearer " + volunteerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String taskId = objectMapper.readTree(claimResponse).get("data").get("id").asText();

        // Then mark in transit
        mockMvc.perform(patch("/api/volunteer/pickups/" + taskId + "/status")
                        .header("Authorization", "Bearer " + volunteerToken)
                        .param("status", "IN_TRANSIT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("IN_TRANSIT"));
    }

    @Test
    void testVolunteerCanMarkCompleted() throws Exception {
        // Claim
        String claimResponse = mockMvc.perform(post("/api/volunteer/pickups/" + acceptedDonation.getId() + "/claim")
                        .header("Authorization", "Bearer " + volunteerToken))
                .andReturn().getResponse().getContentAsString();

        String taskId = objectMapper.readTree(claimResponse).get("data").get("id").asText();

        // In Transit
        mockMvc.perform(patch("/api/volunteer/pickups/" + taskId + "/status")
                        .header("Authorization", "Bearer " + volunteerToken)
                        .param("status", "IN_TRANSIT"))
                .andExpect(status().isOk());

        // Complete
        mockMvc.perform(patch("/api/volunteer/pickups/" + taskId + "/status")
                        .header("Authorization", "Bearer " + volunteerToken)
                        .param("status", "COMPLETED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("COMPLETED"));
    }

    @Test
    void testCompletingPickupUpdatesDonationStatus() throws Exception {
        // Claim
        String claimResponse = mockMvc.perform(post("/api/volunteer/pickups/" + acceptedDonation.getId() + "/claim")
                        .header("Authorization", "Bearer " + volunteerToken))
                .andReturn().getResponse().getContentAsString();

        String taskId = objectMapper.readTree(claimResponse).get("data").get("id").asText();

        // In Transit
        mockMvc.perform(patch("/api/volunteer/pickups/" + taskId + "/status")
                        .header("Authorization", "Bearer " + volunteerToken)
                        .param("status", "IN_TRANSIT"))
                .andExpect(status().isOk());

        // Complete
        mockMvc.perform(patch("/api/volunteer/pickups/" + taskId + "/status")
                        .header("Authorization", "Bearer " + volunteerToken)
                        .param("status", "COMPLETED"))
                .andExpect(status().isOk());

        // Verify donation is now PICKED_UP
        Donation updatedDonation = donationRepository.findById(acceptedDonation.getId()).orElseThrow();
        assertEquals(DonationStatus.PICKED_UP, updatedDonation.getStatus());
    }

    @Test
    void testAnotherVolunteerCannotModifyOthersTask() throws Exception {
        // First volunteer claims
        String claimResponse = mockMvc.perform(post("/api/volunteer/pickups/" + acceptedDonation.getId() + "/claim")
                        .header("Authorization", "Bearer " + volunteerToken))
                .andReturn().getResponse().getContentAsString();

        String taskId = objectMapper.readTree(claimResponse).get("data").get("id").asText();

        // Another volunteer tries to update the status - should fail
        mockMvc.perform(patch("/api/volunteer/pickups/" + taskId + "/status")
                        .header("Authorization", "Bearer " + anotherVolunteerToken)
                        .param("status", "IN_TRANSIT"))
                .andExpect(status().isForbidden());
    }

    @Test
    void testVolunteerCanListOwnPickups() throws Exception {
        // Claim a pickup first
        mockMvc.perform(post("/api/volunteer/pickups/" + acceptedDonation.getId() + "/claim")
                        .header("Authorization", "Bearer " + volunteerToken))
                .andExpect(status().isOk());

        // Then list them
        mockMvc.perform(get("/api/volunteer/pickups")
                        .header("Authorization", "Bearer " + volunteerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));
    }
}

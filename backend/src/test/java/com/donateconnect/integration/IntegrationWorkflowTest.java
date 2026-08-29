package com.donateconnect.integration;

import com.donateconnect.config.JwtUtils;
import com.donateconnect.dto.*;
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
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Full end-to-end integration test:
 * Register/login → create donation → NGO accepts → volunteer claims → IN_TRANSIT → COMPLETED
 * → donation is PICKED_UP → status history exists
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class IntegrationWorkflowTest {

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
    private StatusHistoryRepository statusHistoryRepository;

    @Autowired
    private VolunteerTaskRepository volunteerTaskRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User donorUser;
    private User ngoUser;
    private User volunteerUser;
    private NGOProfile ngoProfile;
    private String donorToken;
    private String ngoToken;
    private String volunteerToken;

    @BeforeEach
    void setup() {
        donorUser = userRepository.save(User.builder()
                .email("donor@integration.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .fullName("Integration Donor")
                .role(Role.DONOR)
                .build());

        ngoUser = userRepository.save(User.builder()
                .email("ngo@integration.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .fullName("Integration NGO Manager")
                .role(Role.NGO)
                .build());

        volunteerUser = userRepository.save(User.builder()
                .email("volunteer@integration.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .fullName("Integration Volunteer")
                .role(Role.VOLUNTEER)
                .build());

        ngoProfile = ngoProfileRepository.save(NGOProfile.builder()
                .user(ngoUser)
                .name("Integration Test NGO")
                .description("An NGO for integration testing")
                .address("123 Integration Street")
                .phone("9876543210")
                .verified(true)
                .build());

        donorToken = jwtUtils.generateToken(donorUser);
        ngoToken = jwtUtils.generateToken(ngoUser);
        volunteerToken = jwtUtils.generateToken(volunteerUser);
    }

    @Test
    void fullDonationLifecycleWorkflow() throws Exception {
        // Step 1: Donor creates a donation
        CreateDonationRequest createRequest = CreateDonationRequest.builder()
                .ngoId(ngoProfile.getId())
                .category(Category.CLOTHES)
                .description("20 cotton shirts and 10 pairs of pants in excellent condition, ready for distribution")
                .photoUrls(List.of("test-photo.jpg"))
                .pickupDate(LocalDate.now().plusDays(3))
                .build();

        MvcResult createResult = mockMvc.perform(post("/api/donations")
                        .header("Authorization", "Bearer " + donorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("REQUESTED"))
                .andReturn();

        String donationId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("data").get("id").asText();

        // Verify StatusHistory entry was created on creation
        long historyCount = statusHistoryRepository.count();
        assertTrue(historyCount >= 1, "Status history should be created when donation is created");

        // Step 2: NGO accepts the donation
        UpdateDonationStatusDto acceptDto = new UpdateDonationStatusDto();
        acceptDto.setStatus(DonationStatus.ACCEPTED);

        mockMvc.perform(patch("/api/ngo/donations/" + donationId + "/status")
                        .header("Authorization", "Bearer " + ngoToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(acceptDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ACCEPTED"));

        // Verify StatusHistory entry after acceptance
        long historyAfterAccept = statusHistoryRepository.count();
        assertTrue(historyAfterAccept > historyCount, "Status history should increase on ACCEPTED transition");

        // Step 3: Volunteer claims pickup
        MvcResult claimResult = mockMvc.perform(post("/api/volunteer/pickups/" + donationId + "/claim")
                        .header("Authorization", "Bearer " + volunteerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CLAIMED"))
                .andReturn();

        String taskId = objectMapper.readTree(claimResult.getResponse().getContentAsString())
                .get("data").get("id").asText();

        // Step 4: Volunteer marks as in transit
        mockMvc.perform(patch("/api/volunteer/pickups/" + taskId + "/status")
                        .header("Authorization", "Bearer " + volunteerToken)
                        .param("status", "IN_TRANSIT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("IN_TRANSIT"));

        // Step 5: Volunteer marks as completed
        mockMvc.perform(patch("/api/volunteer/pickups/" + taskId + "/status")
                        .header("Authorization", "Bearer " + volunteerToken)
                        .param("status", "COMPLETED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("COMPLETED"));

        // Step 6: Verify donation is now PICKED_UP
        Donation finalDonation = donationRepository.findById(UUID.fromString(donationId)).orElseThrow();
        assertEquals(DonationStatus.PICKED_UP, finalDonation.getStatus(),
                "Donation should be PICKED_UP after volunteer marks task COMPLETED");

        // Step 7: Verify Status History has entries for the lifecycle
        List<StatusHistory> historyEntries = statusHistoryRepository.findAll().stream()
                .filter(h -> h.getDonation().getId().toString().equals(donationId))
                .toList();
        assertTrue(historyEntries.size() >= 2, "Status history should have at least 2 entries for the lifecycle");
    }
}

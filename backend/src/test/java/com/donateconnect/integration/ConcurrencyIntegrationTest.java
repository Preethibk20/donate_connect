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

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ConcurrencyIntegrationTest {

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
    private PasswordEncoder passwordEncoder;

    private User donorUser;
    private User ngoUser;
    private User volunteer1;
    private User volunteer2;
    private NGOProfile ngoProfile;
    private String donorToken;
    private String ngoToken;
    private String volunteer1Token;
    private String volunteer2Token;

    @BeforeEach
    void setup() {
        donationRepository.deleteAll();
        ngoProfileRepository.deleteAll();
        userRepository.deleteAll();

        donorUser = userRepository.save(User.builder()
                .email("donor.conc@integration.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .fullName("Donor")
                .role(Role.DONOR)
                .build());

        ngoUser = userRepository.save(User.builder()
                .email("ngo.conc@integration.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .fullName("NGO")
                .role(Role.NGO)
                .build());

        volunteer1 = userRepository.save(User.builder()
                .email("vol1@integration.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .fullName("Volunteer 1")
                .role(Role.VOLUNTEER)
                .build());

        volunteer2 = userRepository.save(User.builder()
                .email("vol2@integration.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .fullName("Volunteer 2")
                .role(Role.VOLUNTEER)
                .build());

        ngoProfile = ngoProfileRepository.save(NGOProfile.builder()
                .user(ngoUser)
                .name("NGO Conc")
                .address("123 Street")
                .phone("9876543210")
                .verified(true)
                .build());

        donorToken = jwtUtils.generateToken(donorUser);
        ngoToken = jwtUtils.generateToken(ngoUser);
        volunteer1Token = jwtUtils.generateToken(volunteer1);
        volunteer2Token = jwtUtils.generateToken(volunteer2);
    }

    @Test
    void concurrentVolunteerClaim_onlyOneWins() throws Exception {
        // Create donation
        CreateDonationRequest createRequest = CreateDonationRequest.builder()
                .ngoId(ngoProfile.getId())
                .category(Category.CLOTHES)
                .description("Test description 20 chars min.......")
                .photoUrls(List.of("test.jpg"))
                .pickupDate(LocalDate.now().plusDays(1))
                .pickupAddress("Bangalore")
                .pickupLat(12.0)
                .pickupLng(77.0)
                .build();

        MvcResult createResult = mockMvc.perform(post("/api/donations")
                .header("Authorization", "Bearer " + donorToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        String donationId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("data").get("id").asText();

        // NGO accepts
        UpdateDonationStatusDto acceptDto = new UpdateDonationStatusDto();
        acceptDto.setStatus(DonationStatus.ACCEPTED);
        mockMvc.perform(patch("/api/ngo/donations/" + donationId + "/status")
                .header("Authorization", "Bearer " + ngoToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(acceptDto)))
                .andExpect(status().isOk());

        // Concurrent claims
        ExecutorService executor = Executors.newFixedThreadPool(2);
        
        Callable<Integer> task1 = () -> {
            try {
                MvcResult result = mockMvc.perform(post("/api/volunteer/pickups/" + donationId + "/claim")
                        .header("Authorization", "Bearer " + volunteer1Token)).andReturn();
                return result.getResponse().getStatus();
            } catch (Exception e) {
                return 500;
            }
        };

        Callable<Integer> task2 = () -> {
            try {
                MvcResult result = mockMvc.perform(post("/api/volunteer/pickups/" + donationId + "/claim")
                        .header("Authorization", "Bearer " + volunteer2Token)).andReturn();
                return result.getResponse().getStatus();
            } catch (Exception e) {
                return 500;
            }
        };

        Future<Integer> f1 = executor.submit(task1);
        Future<Integer> f2 = executor.submit(task2);

        int status1 = f1.get();
        int status2 = f2.get();

        executor.shutdown();

        // Exactly one should succeed (200 OK), the other should fail with 409 Conflict or 400 Bad Request
        int successCount = 0;
        int conflictCount = 0;

        if (status1 == 200) successCount++;
        if (status1 == 409 || status1 == 400) conflictCount++;

        if (status2 == 200) successCount++;
        if (status2 == 409 || status2 == 400) conflictCount++;

        assertEquals(1, successCount, "Exactly one volunteer should successfully claim");
        assertTrue(conflictCount >= 1, "The other volunteer should receive a conflict/bad request");
    }
}

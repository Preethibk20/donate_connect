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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class DeliveryOtpIntegrationTest {

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
    private DeliveryRepository deliveryRepository;

    @Autowired
    private VolunteerTaskRepository volunteerTaskRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User donorUser;
    private User ngoUser;
    private User volunteerUser;
    private NGOProfile ngoProfile;
    private Donation donation;
    private Delivery delivery;
    private String donorToken;
    private String ngoToken;
    private String volunteerToken;

    @BeforeEach
    void setup() {
        donorUser = userRepository.save(User.builder()
                .email("donor.otp@integration.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .fullName("Donor")
                .role(Role.DONOR)
                .build());

        ngoUser = userRepository.save(User.builder()
                .email("ngo.otp@integration.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .fullName("NGO")
                .role(Role.NGO)
                .build());

        volunteerUser = userRepository.save(User.builder()
                .email("vol.otp@integration.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .fullName("Volunteer")
                .role(Role.VOLUNTEER)
                .build());

        ngoProfile = ngoProfileRepository.save(NGOProfile.builder()
                .user(ngoUser)
                .name("NGO OTP")
                .address("123 Street")
                .phone("9876543210")
                .verified(true)
                .build());

        donorToken = jwtUtils.generateToken(donorUser);
        ngoToken = jwtUtils.generateToken(ngoUser);
        volunteerToken = jwtUtils.generateToken(volunteerUser);

        donation = donationRepository.save(Donation.builder()
                .donor(donorUser)
                .ngo(ngoProfile)
                .category(Category.CLOTHES)
                .description("Test description 20 chars min.......")
                .photoUrls(new java.util.ArrayList<>(List.of("test.jpg")))
                .status(DonationStatus.PICKED_UP)
                .pickupDate(LocalDate.now().plusDays(1))
                .pickupAddress("Bangalore")
                .pickupLat(12.0)
                .pickupLng(77.0)
                .build());

        delivery = deliveryRepository.save(Delivery.builder()
                .donation(donation)
                .volunteer(volunteerUser)
                .status(DeliveryStatus.PICKED_UP)
                .deliveryOtp("123456")
                .deliveryOtpExpiry(LocalDateTime.now().plusHours(1))
                .deliveryOtpAttempts(0)
                .build());
    }

    @Test
    void wrongOtpThreeTimesThenRegenerate() throws Exception {
        MockMultipartFile file = new MockMultipartFile("proofImage", "test.jpg", "image/jpeg", "image".getBytes());

        // Attempt 1: wrong OTP
        mockMvc.perform(multipart("/api/volunteer/deliveries/" + delivery.getId() + "/complete")
                        .file(file)
                        .param("otp", "000000")
                        .header("Authorization", "Bearer " + volunteerToken)
                        .with(request -> {
                            request.setMethod("POST");
                            return request;
                        }))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid OTP. Please check the code provided by the NGO."));

        // Attempt 2: wrong OTP
        mockMvc.perform(multipart("/api/volunteer/deliveries/" + delivery.getId() + "/complete")
                        .file(file)
                        .param("otp", "000000")
                        .header("Authorization", "Bearer " + volunteerToken)
                        .with(request -> {
                            request.setMethod("POST");
                            return request;
                        }))
                .andExpect(status().isBadRequest());

        // Attempt 3: wrong OTP
        mockMvc.perform(multipart("/api/volunteer/deliveries/" + delivery.getId() + "/complete")
                        .file(file)
                        .param("otp", "000000")
                        .header("Authorization", "Bearer " + volunteerToken)
                        .with(request -> {
                            request.setMethod("POST");
                            return request;
                        }))
                .andExpect(status().isBadRequest());

        // Attempt 4: should fail even with correct OTP if attempt limit applies
        // But wait, the service checks: if attempts >= 3, then fail.
        mockMvc.perform(multipart("/api/volunteer/deliveries/" + delivery.getId() + "/complete")
                        .file(file)
                        .param("otp", "123456")
                        .header("Authorization", "Bearer " + volunteerToken)
                        .with(request -> {
                            request.setMethod("POST");
                            return request;
                        }))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Maximum OTP attempts exceeded."));

        // Now NGO regenerates OTP
        MvcResult regenResult = mockMvc.perform(post("/api/volunteer/deliveries/donation/" + donation.getId() + "/otp/regenerate")
                        .header("Authorization", "Bearer " + ngoToken))
                .andExpect(status().isOk())
                .andReturn();

        String newOtp = objectMapper.readTree(regenResult.getResponse().getContentAsString())
                .get("data").asText();

        assertNotNull(newOtp);
        assertNotEquals("123456", newOtp);

        // Volunteer completes with new OTP
        mockMvc.perform(multipart("/api/volunteer/deliveries/" + delivery.getId() + "/complete")
                        .file(file)
                        .param("otp", newOtp)
                        .header("Authorization", "Bearer " + volunteerToken)
                        .with(request -> {
                            request.setMethod("POST");
                            return request;
                        }))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("DELIVERED"));
    }

    @Test
    void volunteerCannotCompleteTaskWithoutOtp() throws Exception {
        // Create volunteer task to simulate claiming
        com.donateconnect.entity.VolunteerTask task = com.donateconnect.entity.VolunteerTask.builder()
                .donation(donation)
                .volunteer(volunteerUser)
                .status(com.donateconnect.entity.VolunteerTask.TaskStatus.IN_TRANSIT)
                .build();
        task = volunteerTaskRepository.save(task);

        // Attempt to update task status to COMPLETED directly
        mockMvc.perform(patch("/api/volunteer/pickups/" + task.getId() + "/status?status=COMPLETED")
                .header("Authorization", "Bearer " + volunteerToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Cannot complete task directly. Use the Delivery OTP endpoint."));

        // Verify donation is NOT DELIVERED
        Donation updatedDonation = donationRepository.findById(donation.getId()).orElseThrow();
        assertNotEquals(DonationStatus.DELIVERED, updatedDonation.getStatus());
    }
}

package com.donateconnect.service;

import com.donateconnect.config.JwtUtils;
import com.donateconnect.dto.CreateDonationRequest;
import com.donateconnect.dto.DonationResponseDto;
import com.donateconnect.dto.UpdateDonationStatusDto;
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
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class DonationServiceTests {

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
    private PasswordEncoder passwordEncoder;

    private User donorUser;
    private User ngoUser;
    private User otherNgoUser;
    private NGOProfile ngoProfile;
    private NGOProfile otherNgoProfile;
    private String donorToken;
    private String ngoToken;
    private String otherNgoToken;

    @BeforeEach
    void setup() {
        donorUser = userRepository.save(User.builder()
                .email("donor@test.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .fullName("Test Donor")
                .role(Role.DONOR)
                .build());

        ngoUser = userRepository.save(User.builder()
                .email("ngo@test.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .fullName("Test NGO Manager")
                .role(Role.NGO)
                .build());

        otherNgoUser = userRepository.save(User.builder()
                .email("otherngo@test.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .fullName("Other NGO Manager")
                .role(Role.NGO)
                .build());

        ngoProfile = ngoProfileRepository.save(NGOProfile.builder()
                .user(ngoUser)
                .name("Test NGO")
                .description("Test NGO Description")
                .address("Test Address")
                .phone("1234567890")
                .verified(true)
                .build());

        otherNgoProfile = ngoProfileRepository.save(NGOProfile.builder()
                .user(otherNgoUser)
                .name("Other NGO")
                .description("Other NGO Description")
                .address("Other Address")
                .phone("0987654321")
                .verified(true)
                .build());

        donorToken = jwtUtils.generateToken(donorUser);
        ngoToken = jwtUtils.generateToken(ngoUser);
        otherNgoToken = jwtUtils.generateToken(otherNgoUser);
    }

    // ==================== DONATION CREATION TESTS ====================

    @Test
    void testDonorCreatesValidDonation() throws Exception {
        CreateDonationRequest request = CreateDonationRequest.builder()
                .ngoId(ngoProfile.getId())
                .category(Category.CLOTHES)
                .description("20 cotton shirts in good condition, sizes M and L for winter distribution")
                .photoUrls(List.of("photo1.jpg"))
                .pickupDate(LocalDate.now().plusDays(3))
                .build();

        mockMvc.perform(post("/api/donations")
                        .header("Authorization", "Bearer " + donorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("REQUESTED"))
                .andExpect(jsonPath("$.data.donor.email").value("donor@test.com"));
    }

    @Test
    void testNgoCannotCreateDonation() throws Exception {
        CreateDonationRequest request = CreateDonationRequest.builder()
                .ngoId(ngoProfile.getId())
                .category(Category.FOOD)
                .description("Test food donation description with enough characters")
                .pickupDate(LocalDate.now().plusDays(3))
                .build();

        mockMvc.perform(post("/api/donations")
                        .header("Authorization", "Bearer " + ngoToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testDonorCannotDonateToUnverifiedNgo() throws Exception {
        // Create unverified NGO
        User unverifiedNgoUser = userRepository.save(User.builder()
                .email("unverifiedngo@test.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .fullName("Unverified NGO Manager")
                .role(Role.NGO)
                .build());
        NGOProfile unverifiedNgo = ngoProfileRepository.save(NGOProfile.builder()
                .user(unverifiedNgoUser)
                .name("Unverified NGO")
                .description("Not verified")
                .address("Test Address")
                .phone("1234567890")
                .verified(false)
                .build());

        CreateDonationRequest request = CreateDonationRequest.builder()
                .ngoId(unverifiedNgo.getId())
                .category(Category.BOOKS)
                .description("Books for donation with sufficient description length")
                .pickupDate(LocalDate.now().plusDays(3))
                .build();

        mockMvc.perform(post("/api/donations")
                        .header("Authorization", "Bearer " + donorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    // ==================== NGO RETRIEVAL TESTS ====================

    @Test
    void testNgoCanRetrieveItsAssignedDonations() throws Exception {
        // Create a donation to this NGO
        Donation donation = donationRepository.save(Donation.builder()
                .donor(donorUser)
                .ngo(ngoProfile)
                .category(Category.CLOTHES)
                .description("Test donation")
                .status(DonationStatus.REQUESTED)
                .build());

        mockMvc.perform(get("/api/ngo/donations")
                        .header("Authorization", "Bearer " + ngoToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.content[0].id").value(donation.getId().toString()));
    }

    // ==================== STATUS TRANSITION TESTS ====================

    @Test
    void testNgoAcceptsDonation() throws Exception {
        Donation donation = donationRepository.save(Donation.builder()
                .donor(donorUser)
                .ngo(ngoProfile)
                .category(Category.FOOD)
                .description("Food donation")
                .status(DonationStatus.REQUESTED)
                .build());

        UpdateDonationStatusDto dto = new UpdateDonationStatusDto();
        dto.setStatus(DonationStatus.ACCEPTED);

        mockMvc.perform(patch("/api/ngo/donations/" + donation.getId() + "/status")
                        .header("Authorization", "Bearer " + ngoToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ACCEPTED"));
    }

    @Test
    void testNgoRejectsDonation() throws Exception {
        Donation donation = donationRepository.save(Donation.builder()
                .donor(donorUser)
                .ngo(ngoProfile)
                .category(Category.FOOD)
                .description("Food donation")
                .status(DonationStatus.REQUESTED)
                .build());

        UpdateDonationStatusDto dto = new UpdateDonationStatusDto();
        dto.setStatus(DonationStatus.REJECTED);

        mockMvc.perform(patch("/api/ngo/donations/" + donation.getId() + "/status")
                        .header("Authorization", "Bearer " + ngoToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("REJECTED"));
    }

    @Test
    void testStatusHistoryCreatedOnStatusChange() throws Exception {
        Donation donation = donationRepository.save(Donation.builder()
                .donor(donorUser)
                .ngo(ngoProfile)
                .category(Category.BOOKS)
                .description("Books donation")
                .status(DonationStatus.REQUESTED)
                .build());

        long historyCountBefore = statusHistoryRepository.count();

        UpdateDonationStatusDto dto = new UpdateDonationStatusDto();
        dto.setStatus(DonationStatus.ACCEPTED);

        mockMvc.perform(patch("/api/ngo/donations/" + donation.getId() + "/status")
                        .header("Authorization", "Bearer " + ngoToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk());

        long historyCountAfter = statusHistoryRepository.count();
        assertEquals(historyCountBefore + 1, historyCountAfter);
    }

    @Test
    void testUnauthorizedNgoCannotModifyOtherNgosDonation() throws Exception {
        // Donation belongs to ngoProfile, not otherNgoProfile
        Donation donation = donationRepository.save(Donation.builder()
                .donor(donorUser)
                .ngo(ngoProfile)
                .category(Category.TOYS)
                .description("Toys donation")
                .status(DonationStatus.REQUESTED)
                .build());

        UpdateDonationStatusDto dto = new UpdateDonationStatusDto();
        dto.setStatus(DonationStatus.ACCEPTED);

        mockMvc.perform(patch("/api/ngo/donations/" + donation.getId() + "/status")
                        .header("Authorization", "Bearer " + otherNgoToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testDonorCanViewOwnDonations() throws Exception {
        donationRepository.save(Donation.builder()
                .donor(donorUser)
                .ngo(ngoProfile)
                .category(Category.CLOTHES)
                .description("Clothes donation")
                .status(DonationStatus.REQUESTED)
                .build());

        mockMvc.perform(get("/api/donations/mine")
                        .header("Authorization", "Bearer " + donorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))));
    }

    // ==================== GET /api/donations/mine/{id} TESTS ====================

    @Test
    void testDonorCanRetrieveOwnDonationById() throws Exception {
        Donation donation = donationRepository.save(Donation.builder()
                .donor(donorUser)
                .ngo(ngoProfile)
                .category(Category.BOOKS)
                .description("Test books donation")
                .status(DonationStatus.REQUESTED)
                .build());

        mockMvc.perform(get("/api/donations/mine/" + donation.getId())
                        .header("Authorization", "Bearer " + donorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(donation.getId().toString()))
                .andExpect(jsonPath("$.data.category").value("BOOKS"))
                .andExpect(jsonPath("$.data.status").value("REQUESTED"))
                .andExpect(jsonPath("$.data.donor.email").value("donor@test.com"))
                .andExpect(jsonPath("$.data.ngo.name").value("Test NGO"));
    }

    @Test
    void testDonorCannotRetrieveAnotherDonorsDonationById() throws Exception {
        // Create a second donor
        User otherDonor = userRepository.save(User.builder()
                .email("other-donor@test.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .fullName("Other Donor")
                .role(Role.DONOR)
                .build());
        String otherDonorToken = jwtUtils.generateToken(otherDonor);

        // Donation belongs to otherDonor, not donorUser
        Donation otherDonation = donationRepository.save(Donation.builder()
                .donor(otherDonor)
                .ngo(ngoProfile)
                .category(Category.FOOD)
                .description("Other donor food donation")
                .status(DonationStatus.REQUESTED)
                .build());

        // donorUser tries to read otherDonor's donation → 404 (not leaking ownership)
        mockMvc.perform(get("/api/donations/mine/" + otherDonation.getId())
                        .header("Authorization", "Bearer " + donorToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testGetDonationByIdReturns404ForNonExistentDonation() throws Exception {
        String randomId = java.util.UUID.randomUUID().toString();

        mockMvc.perform(get("/api/donations/mine/" + randomId)
                        .header("Authorization", "Bearer " + donorToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testGetDonationByIdRequiresAuthentication() throws Exception {
        Donation donation = donationRepository.save(Donation.builder()
                .donor(donorUser)
                .ngo(ngoProfile)
                .category(Category.TOYS)
                .description("Test toys donation")
                .status(DonationStatus.REQUESTED)
                .build());

        // No Authorization header → 401
        mockMvc.perform(get("/api/donations/mine/" + donation.getId()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testNgoCannotAccessDonorMineEndpoint() throws Exception {
        Donation donation = donationRepository.save(Donation.builder()
                .donor(donorUser)
                .ngo(ngoProfile)
                .category(Category.STATIONERY)
                .description("Stationery donation")
                .status(DonationStatus.REQUESTED)
                .build());

        // NGO role is not DONOR → 403
        mockMvc.perform(get("/api/donations/mine/" + donation.getId())
                        .header("Authorization", "Bearer " + ngoToken))
                .andExpect(status().isForbidden());
    }
}


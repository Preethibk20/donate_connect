package com.donateconnect.service.impl;

import com.donateconnect.dto.CreateDonationRequest;
import com.donateconnect.entity.*;
import com.donateconnect.repository.DonationRepository;
import com.donateconnect.repository.NGOProfileRepository;
import com.donateconnect.repository.StatusHistoryRepository;
import com.donateconnect.repository.UserRepository;
import com.donateconnect.service.NotificationService;
import com.donateconnect.service.GeocodingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DonationServiceImplTest {

    @Mock
    private DonationRepository donationRepository;
    @Mock
    private NGOProfileRepository ngoProfileRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private StatusHistoryRepository statusHistoryRepository;
    @Mock
    private NotificationService notificationService;
    @Mock
    private GeocodingService geocodingService;

    @InjectMocks
    private DonationServiceImpl donationService;

    private User donor;
    private NGOProfile ngo;
    private Donation donation;

    @BeforeEach
    void setUp() {
        donor = User.builder().id(UUID.randomUUID()).role(Role.DONOR).build();
        User ngoUser = User.builder().id(UUID.randomUUID()).role(Role.NGO).build();
        ngo = NGOProfile.builder().id(UUID.randomUUID()).user(ngoUser).verified(true).build();
        donation = Donation.builder().id(UUID.randomUUID()).donor(donor).ngo(ngo).status(DonationStatus.REQUESTED).build();
    }

    @Test
    void testCreateDonation_Success() {
        CreateDonationRequest request = CreateDonationRequest.builder()
                .ngoId(ngo.getId())
                .category(Category.FOOD)
                .description("Test donation")
                .pickupAddress("123 Bangalore St")
                .build();

        when(userRepository.findById(donor.getId())).thenReturn(Optional.of(donor));
        when(ngoProfileRepository.findById(ngo.getId())).thenReturn(Optional.of(ngo));
        when(donationRepository.save(any(Donation.class))).thenReturn(donation);

        var result = donationService.createDonation(donor.getId(), request);

        assertNotNull(result);
        verify(statusHistoryRepository).save(any(StatusHistory.class));
        verify(notificationService).createNotification(eq(ngo.getUser()), anyString(), eq(donation.getId()));
    }

    @Test
    void testCreateDonation_RejectsNonBengaluru() {
        CreateDonationRequest request = CreateDonationRequest.builder()
                .ngoId(ngo.getId())
                .category(Category.FOOD)
                .description("Test donation")
                .pickupAddress("Mumbai, India")
                .build();

        when(userRepository.findById(donor.getId())).thenReturn(Optional.of(donor));
        when(ngoProfileRepository.findById(ngo.getId())).thenReturn(Optional.of(ngo));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            donationService.createDonation(donor.getId(), request);
        });
        assertTrue(ex.getMessage().contains("Bengaluru region"));
    }

    @Test
    void testUpdateDonationStatus_ThrowsAccessDenied_IfNotOwningNGO() {
        UUID wrongNgoUserId = UUID.randomUUID();
        NGOProfile wrongNgo = NGOProfile.builder().id(UUID.randomUUID()).build();

        when(ngoProfileRepository.findByUserId(wrongNgoUserId)).thenReturn(Optional.of(wrongNgo));
        when(donationRepository.findById(donation.getId())).thenReturn(Optional.of(donation));

        assertThrows(AccessDeniedException.class, () -> {
            donationService.updateDonationStatus(wrongNgoUserId, donation.getId(), DonationStatus.ACCEPTED);
        });
    }

    @Test
    void testUpdateDonationStatus_Success() {
        when(ngoProfileRepository.findByUserId(ngo.getUser().getId())).thenReturn(Optional.of(ngo));
        when(donationRepository.findById(donation.getId())).thenReturn(Optional.of(donation));
        when(donationRepository.save(any(Donation.class))).thenReturn(donation);

        var result = donationService.updateDonationStatus(ngo.getUser().getId(), donation.getId(), DonationStatus.ACCEPTED);

        assertEquals(DonationStatus.ACCEPTED, result.getStatus());
        verify(statusHistoryRepository).save(any(StatusHistory.class));
        verify(notificationService).notifyUser(eq(donor), anyString(), eq(donation.getId()), eq(true));
    }
}

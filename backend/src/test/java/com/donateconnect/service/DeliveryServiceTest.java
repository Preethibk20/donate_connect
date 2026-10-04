package com.donateconnect.service;

import com.donateconnect.dto.DeliveryDto;
import com.donateconnect.entity.Delivery;
import com.donateconnect.entity.DeliveryStatus;
import com.donateconnect.entity.Donation;
import com.donateconnect.entity.User;
import com.donateconnect.repository.DeliveryRepository;
import com.donateconnect.repository.DonationRepository;
import com.donateconnect.service.impl.DeliveryServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DeliveryServiceTest {

    @Mock
    private DeliveryRepository deliveryRepository;
    
    @Mock
    private DonationRepository donationRepository;

    @Mock
    private StorageService storageService;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private DeliveryServiceImpl deliveryService;

    private User volunteer;
    private Donation donation;
    private Delivery delivery;
    private UUID volunteerId = UUID.randomUUID();
    private UUID deliveryId = UUID.randomUUID();
    private UUID donationId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        volunteer = new User();
        volunteer.setId(volunteerId);

        donation = new Donation();
        donation.setId(donationId);

        delivery = new Delivery();
        delivery.setId(deliveryId);
        delivery.setVolunteer(volunteer);
        delivery.setDonation(donation);
        delivery.setStatus(DeliveryStatus.ASSIGNED);
        delivery.setDeliveryOtp("123456");
    }

    @Test
    void testUpdateDeliveryStatus_Success() {
        when(deliveryRepository.findById(deliveryId)).thenReturn(Optional.of(delivery));
        when(deliveryRepository.save(any(Delivery.class))).thenReturn(delivery);

        DeliveryDto result = deliveryService.updateDeliveryStatus(volunteerId, deliveryId, DeliveryStatus.ACCEPTED_BY_VOLUNTEER);

        assertEquals(DeliveryStatus.ACCEPTED_BY_VOLUNTEER, result.getStatus());
        verify(deliveryRepository).save(delivery);
    }

    @Test
    void testUpdateDeliveryStatus_UnauthorizedVolunteer_ThrowsException() {
        UUID otherVolunteerId = UUID.randomUUID();
        when(deliveryRepository.findById(deliveryId)).thenReturn(Optional.of(delivery));

        assertThrows(IllegalArgumentException.class, () -> {
            deliveryService.updateDeliveryStatus(otherVolunteerId, deliveryId, DeliveryStatus.PICKED_UP);
        });

        verify(deliveryRepository, never()).save(any());
    }


}

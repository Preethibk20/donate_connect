package com.donateconnect.controller;

import com.donateconnect.dto.LocationUpdateDto;
import com.donateconnect.entity.Delivery;
import com.donateconnect.repository.DeliveryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
public class LocationWebSocketController {

    private final DeliveryRepository deliveryRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/delivery/{id}/location")
    public void handleLocationUpdate(@DestinationVariable UUID id, @Payload LocationUpdateDto location, Principal principal) {
        UsernamePasswordAuthenticationToken auth = (UsernamePasswordAuthenticationToken) principal;
        UUID userId = (UUID) auth.getDetails();

        Delivery delivery = deliveryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Delivery not found"));

        if (!delivery.getVolunteer().getId().equals(userId)) {
            throw new AccessDeniedException("You are not assigned to this delivery");
        }

        // Active Delivery Check: Stop tracking location outside active delivery
        if (delivery.getStatus() == com.donateconnect.entity.DeliveryStatus.DELIVERED ||
            delivery.getDonation().getStatus() == com.donateconnect.entity.DonationStatus.DELIVERED ||
            delivery.getDonation().getStatus() == com.donateconnect.entity.DonationStatus.REJECTED) {
            throw new AccessDeniedException("Location updates are disabled for completed or cancelled deliveries");
        }

        // Rate Limiting Check: Max 1 ping per 3 seconds (3000 ms)
        if (delivery.getLastLocationAt() != null) {
            long diffMs = java.time.Duration.between(delivery.getLastLocationAt(), java.time.LocalDateTime.now()).toMillis();
            if (diffMs < 3000) {
                // Rate limited: skip saving and broadcasting to prevent ping flooding
                return;
            }
        }

        delivery.setLastLat(location.getLat());
        delivery.setLastLng(location.getLng());
        delivery.setLastLocationAt(java.time.LocalDateTime.now());
        deliveryRepository.save(delivery);

        messagingTemplate.convertAndSend("/topic/donation/" + delivery.getDonation().getId(), location);
    }
}

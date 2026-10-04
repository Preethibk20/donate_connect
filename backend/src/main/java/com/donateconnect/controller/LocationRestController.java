package com.donateconnect.controller;

import com.donateconnect.dto.ApiResponse;
import com.donateconnect.dto.LocationUpdateDto;
import com.donateconnect.entity.Delivery;
import com.donateconnect.entity.User;
import com.donateconnect.exception.ResourceNotFoundException;
import com.donateconnect.repository.DeliveryRepository;
import com.donateconnect.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/deliveries")
@RequiredArgsConstructor
public class LocationRestController {

    private final DeliveryRepository deliveryRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

    @PostMapping("/{id}/location")
    @PreAuthorize("hasRole('VOLUNTEER')")
    public ResponseEntity<ApiResponse<Void>> updateLocationRest(
            Authentication authentication,
            @PathVariable UUID id,
            @Valid @RequestBody LocationUpdateDto location
    ) {
        UUID volunteerId = getUserIdFromAuth(authentication);
        Delivery delivery = deliveryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found"));
        
        if (!delivery.getVolunteer().getId().equals(volunteerId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        // Active Delivery Check: Stop tracking location outside active delivery
        if (delivery.getStatus() == com.donateconnect.entity.DeliveryStatus.DELIVERED ||
            delivery.getDonation().getStatus() == com.donateconnect.entity.DonationStatus.DELIVERED ||
            delivery.getDonation().getStatus() == com.donateconnect.entity.DonationStatus.REJECTED) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Location updates are disabled for completed or cancelled deliveries"));
        }

        // Rate Limiting Check: Max 1 ping per 3 seconds (3000 ms)
        if (delivery.getLastLocationAt() != null) {
            long diffMs = java.time.Duration.between(delivery.getLastLocationAt(), java.time.LocalDateTime.now()).toMillis();
            if (diffMs < 3000) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .body(ApiResponse.error("Rate limit exceeded: Location updates are limited to once every 3 seconds"));
            }
        }

        delivery.setLastLat(location.getLat());
        delivery.setLastLng(location.getLng());
        delivery.setLastLocationAt(java.time.LocalDateTime.now());
        deliveryRepository.save(delivery);

        messagingTemplate.convertAndSend("/topic/donation/" + delivery.getDonation().getId(), location);

        return ResponseEntity.ok(ApiResponse.success("Location updated successfully", null));
    }

    @GetMapping("/donations/{id}/location")
    @PreAuthorize("hasAnyRole('DONOR', 'NGO', 'ADMIN', 'VOLUNTEER')")
    public ResponseEntity<ApiResponse<LocationUpdateDto>> getLocationRest(
            Authentication authentication,
            @PathVariable("id") UUID donationId
    ) {
        UUID userId = getUserIdFromAuth(authentication);
        Delivery delivery = deliveryRepository.findByDonationId(donationId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found for donation"));
        
        String role = authentication.getAuthorities().iterator().next().getAuthority();
        
        if (!role.equals("ROLE_ADMIN")) {
            UUID donorId = delivery.getDonation().getDonor().getId();
            UUID ngoId = delivery.getDonation().getNgo().getUser().getId();
            UUID volunteerId = delivery.getVolunteer().getId();
            if (!userId.equals(donorId) && !userId.equals(ngoId) && !userId.equals(volunteerId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        }

        // Active Delivery Check: Do not leak location for completed or cancelled deliveries
        if (delivery.getStatus() == com.donateconnect.entity.DeliveryStatus.DELIVERED ||
            delivery.getDonation().getStatus() == com.donateconnect.entity.DonationStatus.DELIVERED ||
            delivery.getDonation().getStatus() == com.donateconnect.entity.DonationStatus.REJECTED) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Live tracking is closed. This delivery is completed or cancelled."));
        }

        LocationUpdateDto dto = new LocationUpdateDto();
        dto.setDeliveryId(delivery.getId());
        dto.setLat(delivery.getLastLat());
        dto.setLng(delivery.getLastLng());
        dto.setTimestamp(delivery.getLastLocationAt());

        return ResponseEntity.ok(ApiResponse.success("Fetched latest location", dto));
    }

    private UUID getUserIdFromAuth(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user profile not found"));
        return user.getId();
    }
}

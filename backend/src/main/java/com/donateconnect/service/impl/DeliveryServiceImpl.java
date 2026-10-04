package com.donateconnect.service.impl;

import com.donateconnect.dto.DeliveryDto;
import com.donateconnect.entity.Delivery;
import com.donateconnect.entity.DeliveryStatus;
import com.donateconnect.entity.Donation;
import com.donateconnect.entity.DonationStatus;
import com.donateconnect.exception.ResourceNotFoundException;
import com.donateconnect.repository.DeliveryRepository;
import com.donateconnect.repository.DonationRepository;
import com.donateconnect.service.DeliveryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DeliveryServiceImpl implements DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final DonationRepository donationRepository;
    private final com.donateconnect.service.StorageService storageService;
    private final com.donateconnect.service.NotificationService notificationService;

    @Override
    @Transactional
    public DeliveryDto updateDeliveryStatus(UUID volunteerId, UUID deliveryId, DeliveryStatus newStatus) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found"));

        if (!delivery.getVolunteer().getId().equals(volunteerId)) {
            throw new IllegalArgumentException("You are not assigned to this delivery");
        }

        DeliveryStatus currentStatus = delivery.getStatus();
        
        // Validate transition
        if (!isValidTransition(currentStatus, newStatus)) {
            throw new IllegalArgumentException("Invalid status transition from " + currentStatus + " to " + newStatus);
        }

        delivery.setStatus(newStatus);
        
        // Timestamp tracking
        if (newStatus == DeliveryStatus.PICKED_UP) {
            delivery.setPickedUpAt(LocalDateTime.now());
            // Generate OTP for proof of delivery with expiry
            delivery.setDeliveryOtp(String.format("%06d", new java.security.SecureRandom().nextInt(1000000)));
            delivery.setDeliveryOtpExpiry(LocalDateTime.now().plusHours(24));
            delivery.setDeliveryOtpAttempts(0);
        } else if (newStatus == DeliveryStatus.DELIVERED) {
            delivery.setDeliveredAt(LocalDateTime.now());
        }

        // Sync with Donation status
        Donation donation = delivery.getDonation();
        if (newStatus == DeliveryStatus.PICKED_UP) {
            donation.setStatus(DonationStatus.PICKED_UP);
            donationRepository.save(donation);
        } else if (newStatus == DeliveryStatus.DELIVERED) {
            donation.setStatus(DonationStatus.DELIVERED);
            donationRepository.save(donation);
        }

        // Send notifications
        notifyStatusChange(delivery, newStatus);

        Delivery saved = deliveryRepository.save(delivery);
        return mapToDto(saved);
    }

    private boolean isValidTransition(DeliveryStatus current, DeliveryStatus next) {
        return switch (current) {
            case ASSIGNED -> next == DeliveryStatus.ACCEPTED_BY_VOLUNTEER;
            case ACCEPTED_BY_VOLUNTEER -> next == DeliveryStatus.EN_ROUTE_TO_PICKUP;
            case EN_ROUTE_TO_PICKUP -> next == DeliveryStatus.PICKED_UP;
            case PICKED_UP -> next == DeliveryStatus.EN_ROUTE_TO_NGO;
            case EN_ROUTE_TO_NGO -> next == DeliveryStatus.DELIVERED;
            case DELIVERED -> false;
        };
    }

    @Override
    @Transactional
    public DeliveryDto completeDelivery(UUID volunteerId, UUID deliveryId, String otp, org.springframework.web.multipart.MultipartFile proofImage) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found"));

        if (!delivery.getVolunteer().getId().equals(volunteerId)) {
            throw new IllegalArgumentException("You are not assigned to this delivery");
        }

        if (delivery.getStatus() == DeliveryStatus.DELIVERED) {
            throw new IllegalArgumentException("Delivery is already completed");
        }

        // Verify OTP
        if (delivery.getDeliveryOtp() == null) {
            throw new IllegalArgumentException("No OTP generated for this delivery.");
        }
        if (delivery.getDeliveryOtpAttempts() >= 3) {
            throw new IllegalArgumentException("Maximum OTP attempts exceeded.");
        }
        if (delivery.getDeliveryOtpExpiry() != null && LocalDateTime.now().isAfter(delivery.getDeliveryOtpExpiry())) {
            throw new IllegalArgumentException("OTP has expired.");
        }
        if (!delivery.getDeliveryOtp().equals(otp)) {
            delivery.setDeliveryOtpAttempts(delivery.getDeliveryOtpAttempts() + 1);
            deliveryRepository.save(delivery);
            throw new IllegalArgumentException("Invalid OTP. Please check the code provided by the NGO.");
        }

        // Validate state
        if (delivery.getStatus() != DeliveryStatus.EN_ROUTE_TO_NGO && delivery.getStatus() != DeliveryStatus.PICKED_UP) {
            throw new IllegalArgumentException("Delivery must be PICKED_UP or EN_ROUTE_TO_NGO to complete");
        }

        // Upload proof image
        try {
            String imageUrl = storageService.store(proofImage.getBytes(), proofImage.getOriginalFilename());
            delivery.setProofImageUrl(imageUrl);
        } catch (java.io.IOException e) {
            throw new RuntimeException("Failed to store proof image", e);
        }

        delivery.setStatus(DeliveryStatus.DELIVERED);
        delivery.setDeliveredAt(LocalDateTime.now());

        // Sync with Donation status
        Donation donation = delivery.getDonation();
        donation.setStatus(DonationStatus.DELIVERED);
        donationRepository.save(donation);

        // Send notifications
        notifyStatusChange(delivery, DeliveryStatus.DELIVERED);

        return mapToDto(deliveryRepository.save(delivery));
    }

    private void notifyStatusChange(Delivery delivery, DeliveryStatus newStatus) {
        String donorMessage = null;
        String ngoMessage = null;
        boolean emailImportant = false;

        switch (newStatus) {
            case ASSIGNED:
                donorMessage = "A volunteer has been assigned to pick up your donation.";
                ngoMessage = "A volunteer has been assigned to deliver a donation to your hub.";
                break;
            case PICKED_UP:
                donorMessage = "Your donation has been picked up and is en route!";
                ngoMessage = "A donation is on its way to your hub.";
                emailImportant = true;
                break;
            case EN_ROUTE_TO_NGO:
                donorMessage = "Your donation is nearing its destination!";
                ngoMessage = "A volunteer is near your destination to drop off a donation.";
                break;
            case DELIVERED:
                donorMessage = "Your donation has been successfully delivered! Thank you for your contribution.";
                ngoMessage = "A donation has been successfully delivered and verified at your hub.";
                emailImportant = true;
                break;
            default:
                break;
        }

        UUID donationId = delivery.getDonation().getId();
        
        if (donorMessage != null) {
            notificationService.notifyUser(delivery.getDonation().getDonor(), donorMessage, donationId, emailImportant);
        }
        if (ngoMessage != null) {
            notificationService.notifyUser(delivery.getDonation().getNgo().getUser(), ngoMessage, donationId, emailImportant);
        }
    }

    private DeliveryDto mapToDto(Delivery delivery) {
        return DeliveryDto.builder()
                .id(delivery.getId())
                .donationId(delivery.getDonation().getId())
                .volunteerId(delivery.getVolunteer().getId())
                .status(delivery.getStatus())
                .assignedAt(delivery.getAssignedAt())
                .pickedUpAt(delivery.getPickedUpAt())
                .deliveredAt(delivery.getDeliveredAt())
                .lastLat(delivery.getLastLat())
                .lastLng(delivery.getLastLng())
                .lastLocationAt(delivery.getLastLocationAt())

                .proofImageUrl(delivery.getProofImageUrl())
                .build();
    }
}

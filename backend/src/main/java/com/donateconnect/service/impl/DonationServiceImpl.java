package com.donateconnect.service.impl;

import com.donateconnect.dto.CreateDonationRequest;
import com.donateconnect.dto.DonationResponseDto;
import com.donateconnect.dto.NGOProfileDto;
import com.donateconnect.dto.UserResponseDto;
import com.donateconnect.entity.*;
import com.donateconnect.exception.ResourceNotFoundException;
import com.donateconnect.repository.DonationRepository;
import com.donateconnect.repository.NGOProfileRepository;
import com.donateconnect.repository.StatusHistoryRepository;
import com.donateconnect.repository.UserRepository;
import com.donateconnect.service.DonationService;
import com.donateconnect.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DonationServiceImpl implements DonationService {

    private final DonationRepository donationRepository;
    private final NGOProfileRepository ngoProfileRepository;
    private final UserRepository userRepository;
    private final StatusHistoryRepository statusHistoryRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public DonationResponseDto createDonation(UUID donorUserId, CreateDonationRequest request) {
        User donor = userRepository.findById(donorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Donor user not found with id: " + donorUserId));

        NGOProfile ngo = ngoProfileRepository.findById(request.getNgoId())
                .orElseThrow(() -> new ResourceNotFoundException("NGO profile not found with id: " + request.getNgoId()));

        if (!ngo.isVerified()) {
            throw new IllegalArgumentException("Cannot donate to an unverified NGO");
        }

        Donation donation = Donation.builder()
                .donor(donor)
                .ngo(ngo)
                .category(request.getCategory())
                .description(request.getDescription())
                .photoUrls(request.getPhotoUrls() != null ? request.getPhotoUrls() : List.of())
                .status(DonationStatus.REQUESTED)
                .pickupDate(request.getPickupDate())
                .build();

        Donation saved = donationRepository.save(donation);

        // Record Status History Audit Trail
        StatusHistory history = StatusHistory.builder()
                .donation(saved)
                .status(DonationStatus.REQUESTED)
                .build();
        statusHistoryRepository.save(history);

        // Send Notification to NGO User
        notificationService.createNotification(
                ngo.getUser(),
                "New donation request received for category: " + saved.getCategory(),
                saved.getId()
        );

        return mapToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DonationResponseDto> getDonationsByDonor(UUID donorUserId, Pageable pageable) {
        return donationRepository.findByDonorIdOrderByCreatedAtDesc(donorUserId, pageable)
                .map(this::mapToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public DonationResponseDto getDonationByDonorAndId(UUID donorUserId, UUID donationId) {
        // findByIdAndDonorId returns empty if the donation does not exist OR belongs
        // to a different donor — both are surfaced as 404 to avoid leaking ownership.
        Donation donation = donationRepository.findByIdAndDonorId(donationId, donorUserId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Donation not found or does not belong to the current user"));
        return mapToDto(donation);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DonationResponseDto> getDonationsByNgoUser(UUID ngoUserId, Pageable pageable) {
        NGOProfile ngoProfile = ngoProfileRepository.findByUserId(ngoUserId)
                .orElseThrow(() -> new ResourceNotFoundException("NGO profile not found for user id: " + ngoUserId));

        return donationRepository.findByNgoIdOrderByCreatedAtDesc(ngoProfile.getId(), pageable)
                .map(this::mapToDto);
    }

    @Override
    @Transactional
    public DonationResponseDto updateDonationStatus(UUID ngoUserId, UUID donationId, DonationStatus newStatus) {
        NGOProfile ngoProfile = ngoProfileRepository.findByUserId(ngoUserId)
                .orElseThrow(() -> new ResourceNotFoundException("NGO profile not found for user id: " + ngoUserId));

        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new ResourceNotFoundException("Donation not found with id: " + donationId));

        if (!donation.getNgo().getId().equals(ngoProfile.getId())) {
            throw new AccessDeniedException("Forbidden: You are not authorized to update status for another NGO's donation");
        }

        donation.setStatus(newStatus);
        Donation updated = donationRepository.save(donation);

        // Record Status History Audit Trail
        StatusHistory history = StatusHistory.builder()
                .donation(updated)
                .status(newStatus)
                .build();
        statusHistoryRepository.save(history);

        // Send Notification to Donor User
        notificationService.createNotification(
                donation.getDonor(),
                "Your donation request (" + donation.getCategory() + ") status was updated to: " + newStatus,
                donation.getId()
        );

        return mapToDto(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DonationResponseDto> getAdminDonations(Category category, DonationStatus status, UUID ngoId, Pageable pageable) {
        Specification<Donation> spec = Specification.where(null);

        if (category != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("category"), category));
        }

        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }

        if (ngoId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("ngo").get("id"), ngoId));
        }

        Page<Donation> donationPage = donationRepository.findAll(spec, pageable);
        return donationPage.map(this::mapToDto);
    }

    private DonationResponseDto mapToDto(Donation d) {
        User donor = d.getDonor();
        UserResponseDto donorDto = UserResponseDto.builder()
                .id(donor.getId())
                .email(donor.getEmail())
                .fullName(donor.getFullName())
                .role(donor.getRole())
                .createdAt(donor.getCreatedAt())
                .build();

        NGOProfile ngo = d.getNgo();
        User ngoUser = ngo.getUser();
        UserResponseDto ngoUserDto = UserResponseDto.builder()
                .id(ngoUser.getId())
                .email(ngoUser.getEmail())
                .fullName(ngoUser.getFullName())
                .role(ngoUser.getRole())
                .createdAt(ngoUser.getCreatedAt())
                .build();

        NGOProfileDto ngoDto = NGOProfileDto.builder()
                .id(ngo.getId())
                .user(ngoUserDto)
                .name(ngo.getName())
                .description(ngo.getDescription())
                .address(ngo.getAddress())
                .phone(ngo.getPhone())
                .verified(ngo.isVerified())
                .createdAt(ngo.getCreatedAt())
                .build();

        return DonationResponseDto.builder()
                .id(d.getId())
                .donor(donorDto)
                .ngo(ngoDto)
                .category(d.getCategory())
                .description(d.getDescription())
                .photoUrls(d.getPhotoUrls())
                .status(d.getStatus())
                .pickupDate(d.getPickupDate())
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
                .build();
    }
}

package com.donateconnect.service.impl;

import com.donateconnect.dto.DonationResponseDto;
import com.donateconnect.dto.NGOProfileDto;
import com.donateconnect.dto.UserResponseDto;
import com.donateconnect.dto.VolunteerTaskDto;
import com.donateconnect.entity.*;
import com.donateconnect.exception.ResourceNotFoundException;
import com.donateconnect.repository.*;
import com.donateconnect.service.VolunteerService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VolunteerServiceImpl implements VolunteerService {

    private final VolunteerTaskRepository volunteerTaskRepository;
    private final DonationRepository donationRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<DonationResponseDto> getAvailablePickups(Pageable pageable) {
        return donationRepository.findAvailableForPickup(pageable)
                .map(this::mapDonationToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VolunteerTaskDto> getMyTasks(UUID volunteerId) {
        return volunteerTaskRepository.findByVolunteerIdOrderByClaimedAtDesc(volunteerId).stream()
                .map(this::mapTaskToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public VolunteerTaskDto claimPickup(UUID volunteerId, UUID donationId) {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new ResourceNotFoundException("Donation not found with id: " + donationId));

        // Validate the donation is in a claimable state
        if (donation.getStatus() != DonationStatus.ACCEPTED) {
            throw new IllegalArgumentException(
                "Cannot claim pickup: donation must be in ACCEPTED status, but is " + donation.getStatus());
        }

        // Prevent race condition: ensure no other volunteer has already claimed it
        volunteerTaskRepository.findByDonationIdAndStatusNot(donationId, VolunteerTask.TaskStatus.CANCELLED)
                .ifPresent(existingTask -> {
                    throw new IllegalArgumentException(
                        "This pickup has already been claimed by another volunteer");
                });

        User volunteer = userRepository.findById(volunteerId)
                .orElseThrow(() -> new ResourceNotFoundException("Volunteer user not found with id: " + volunteerId));

        VolunteerTask task = VolunteerTask.builder()
                .donation(donation)
                .volunteer(volunteer)
                .status(VolunteerTask.TaskStatus.CLAIMED)
                .routeNotes("Assigned to volunteer for pickup dispatch.")
                .build();

        return mapTaskToDto(volunteerTaskRepository.save(task));
    }

    @Override
    @Transactional
    public VolunteerTaskDto updateTaskStatus(UUID volunteerId, boolean isAdmin, UUID taskId, VolunteerTask.TaskStatus newStatus) {
        VolunteerTask task = volunteerTaskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Volunteer task not found with id: " + taskId));

        // Ownership check: only the assigned volunteer (or admin) can update
        if (!isAdmin && !task.getVolunteer().getId().equals(volunteerId)) {
            throw new AccessDeniedException(
                "Forbidden: You are not authorized to update this volunteer task");
        }

        // State machine validation
        validateStatusTransition(task.getStatus(), newStatus);

        task.setStatus(newStatus);

        // Side effect: when task is COMPLETED, update the donation to PICKED_UP
        if (newStatus == VolunteerTask.TaskStatus.COMPLETED) {
            Donation donation = task.getDonation();
            donation.setStatus(DonationStatus.PICKED_UP);
            donationRepository.save(donation);
        }

        return mapTaskToDto(volunteerTaskRepository.save(task));
    }

    /**
     * Validates that the state transition is legal.
     * Allowed: CLAIMED → IN_TRANSIT → COMPLETED
     *          CLAIMED → CANCELLED
     *          IN_TRANSIT → CANCELLED
     */
    private void validateStatusTransition(VolunteerTask.TaskStatus current, VolunteerTask.TaskStatus next) {
        boolean valid = switch (current) {
            case CLAIMED -> next == VolunteerTask.TaskStatus.IN_TRANSIT || next == VolunteerTask.TaskStatus.CANCELLED;
            case IN_TRANSIT -> next == VolunteerTask.TaskStatus.COMPLETED || next == VolunteerTask.TaskStatus.CANCELLED;
            case COMPLETED, CANCELLED -> false;
        };
        if (!valid) {
            throw new IllegalArgumentException(
                "Invalid status transition from " + current + " to " + next);
        }
    }

    private DonationResponseDto mapDonationToDto(Donation d) {
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

    private VolunteerTaskDto mapTaskToDto(VolunteerTask t) {
        DonationResponseDto donationDto = mapDonationToDto(t.getDonation());

        User v = t.getVolunteer();
        UserResponseDto volunteerDto = UserResponseDto.builder()
                .id(v.getId())
                .email(v.getEmail())
                .fullName(v.getFullName())
                .role(v.getRole())
                .createdAt(v.getCreatedAt())
                .build();

        return VolunteerTaskDto.builder()
                .id(t.getId())
                .donation(donationDto)
                .volunteer(volunteerDto)
                .status(t.getStatus())
                .routeNotes(t.getRouteNotes())
                .claimedAt(t.getClaimedAt())
                .build();
    }
}

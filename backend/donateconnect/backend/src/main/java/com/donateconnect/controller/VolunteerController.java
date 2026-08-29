package com.donateconnect.controller;

import com.donateconnect.dto.ApiResponse;
import com.donateconnect.dto.DonationResponseDto;
import com.donateconnect.dto.UserResponseDto;
import com.donateconnect.dto.VolunteerTaskDto;
import com.donateconnect.entity.Donation;
import com.donateconnect.entity.DonationStatus;
import com.donateconnect.entity.User;
import com.donateconnect.entity.VolunteerTask;
import com.donateconnect.exception.ResourceNotFoundException;
import com.donateconnect.repository.DonationRepository;
import com.donateconnect.repository.UserRepository;
import com.donateconnect.repository.VolunteerTaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/volunteer")
@PreAuthorize("hasAnyRole('VOLUNTEER', 'ADMIN')")
@RequiredArgsConstructor
public class VolunteerController {

    private final VolunteerTaskRepository volunteerTaskRepository;
    private final DonationRepository donationRepository;
    private final UserRepository userRepository;

    @GetMapping("/pickups")
    public ResponseEntity<ApiResponse<List<VolunteerTaskDto>>> getMyTasks(Authentication authentication) {
        User user = getAuthUser(authentication);
        List<VolunteerTaskDto> tasks = volunteerTaskRepository.findByVolunteerIdOrderByClaimedAtDesc(user.getId()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Fetched volunteer pickup tasks", tasks));
    }

    @PostMapping("/pickups/{donationId}/claim")
    public ResponseEntity<ApiResponse<VolunteerTaskDto>> claimPickup(
            Authentication authentication,
            @PathVariable UUID donationId
    ) {
        User user = getAuthUser(authentication);
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new ResourceNotFoundException("Donation not found"));

        VolunteerTask task = VolunteerTask.builder()
                .donation(donation)
                .volunteer(user)
                .status(VolunteerTask.TaskStatus.CLAIMED)
                .routeNotes("Assigned to volunteer driver for pickup dispatch.")
                .build();

        VolunteerTask saved = volunteerTaskRepository.save(task);
        return ResponseEntity.ok(ApiResponse.success("Claimed pickup task successfully", mapToDto(saved)));
    }

    @PatchMapping("/pickups/{taskId}/status")
    public ResponseEntity<ApiResponse<VolunteerTaskDto>> updateTaskStatus(
            @PathVariable UUID taskId,
            @RequestParam VolunteerTask.TaskStatus status
    ) {
        VolunteerTask task = volunteerTaskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Volunteer task not found"));

        task.setStatus(status);
        if (status == VolunteerTask.TaskStatus.COMPLETED) {
            Donation donation = task.getDonation();
            donation.setStatus(DonationStatus.PICKED_UP);
            donationRepository.save(donation);
        }
        VolunteerTask saved = volunteerTaskRepository.save(task);
        return ResponseEntity.ok(ApiResponse.success("Updated task status", mapToDto(saved)));
    }

    private User getAuthUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private VolunteerTaskDto mapToDto(VolunteerTask t) {
        Donation d = t.getDonation();
        User donor = d.getDonor();
        UserResponseDto donorDto = UserResponseDto.builder()
                .id(donor.getId())
                .email(donor.getEmail())
                .fullName(donor.getFullName())
                .role(donor.getRole())
                .createdAt(donor.getCreatedAt())
                .build();

        DonationResponseDto donationDto = DonationResponseDto.builder()
                .id(d.getId())
                .donor(donorDto)
                .category(d.getCategory())
                .description(d.getDescription())
                .photoUrls(d.getPhotoUrls())
                .status(d.getStatus())
                .pickupDate(d.getPickupDate())
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
                .build();

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

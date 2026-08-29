package com.donateconnect.controller;

import com.donateconnect.dto.ApiResponse;
import com.donateconnect.dto.DonationResponseDto;
import com.donateconnect.dto.VolunteerTaskDto;
import com.donateconnect.entity.Role;
import com.donateconnect.entity.User;
import com.donateconnect.entity.VolunteerTask;
import com.donateconnect.exception.ResourceNotFoundException;
import com.donateconnect.repository.UserRepository;
import com.donateconnect.service.VolunteerService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/volunteer")
@PreAuthorize("hasAnyRole('VOLUNTEER', 'ADMIN')")
@RequiredArgsConstructor
public class VolunteerController {

    private final VolunteerService volunteerService;
    private final UserRepository userRepository;

    /**
     * GET /api/volunteer/pickups/available
     * Returns paginated list of ACCEPTED donations that have no active volunteer claim.
     */
    @GetMapping("/pickups/available")
    public ResponseEntity<ApiResponse<Page<DonationResponseDto>>> getAvailablePickups(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("createdAt").ascending());
        Page<DonationResponseDto> available = volunteerService.getAvailablePickups(pageRequest);
        return ResponseEntity.ok(ApiResponse.success("Available pickups retrieved", available));
    }

    /**
     * GET /api/volunteer/pickups
     * Returns the authenticated volunteer's own task list.
     */
    @GetMapping("/pickups")
    public ResponseEntity<ApiResponse<List<VolunteerTaskDto>>> getMyTasks(Authentication authentication) {
        User user = getAuthUser(authentication);
        List<VolunteerTaskDto> tasks = volunteerService.getMyTasks(user.getId());
        return ResponseEntity.ok(ApiResponse.success("Fetched volunteer pickup tasks", tasks));
    }

    /**
     * POST /api/volunteer/pickups/{donationId}/claim
     * Claims an available pickup for the authenticated volunteer.
     * Returns 400 if already claimed or invalid state.
     */
    @PostMapping("/pickups/{donationId}/claim")
    public ResponseEntity<ApiResponse<VolunteerTaskDto>> claimPickup(
            Authentication authentication,
            @PathVariable UUID donationId
    ) {
        User user = getAuthUser(authentication);
        VolunteerTaskDto task = volunteerService.claimPickup(user.getId(), donationId);
        return ResponseEntity.ok(ApiResponse.success("Claimed pickup task successfully", task));
    }

    /**
     * PATCH /api/volunteer/pickups/{taskId}/status
     * Updates the status of a volunteer task. Only the owning volunteer (or ADMIN) can do this.
     * Validates state machine transitions: CLAIMED → IN_TRANSIT → COMPLETED (or CANCELLED from either).
     */
    @PatchMapping("/pickups/{taskId}/status")
    public ResponseEntity<ApiResponse<VolunteerTaskDto>> updateTaskStatus(
            Authentication authentication,
            @PathVariable UUID taskId,
            @RequestParam VolunteerTask.TaskStatus status
    ) {
        User user = getAuthUser(authentication);
        boolean isAdmin = user.getRole() == Role.ADMIN;
        VolunteerTaskDto updated = volunteerService.updateTaskStatus(user.getId(), isAdmin, taskId, status);
        return ResponseEntity.ok(ApiResponse.success("Updated task status", updated));
    }

    private User getAuthUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
    }
}

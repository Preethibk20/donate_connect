package com.donateconnect.controller;

import com.donateconnect.dto.ApiResponse;
import com.donateconnect.dto.CreateRatingRequest;
import com.donateconnect.dto.VolunteerRatingDto;
import com.donateconnect.entity.User;
import com.donateconnect.exception.ResourceNotFoundException;
import com.donateconnect.repository.UserRepository;
import com.donateconnect.service.VolunteerRatingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/volunteer/{volunteerId}/ratings")
@RequiredArgsConstructor
public class VolunteerRatingController {

    private final VolunteerRatingService ratingService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<VolunteerRatingDto>>> getRatings(
            @PathVariable UUID volunteerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<VolunteerRatingDto> ratings = ratingService.getRatingsByVolunteerId(volunteerId, pageRequest);
        return ResponseEntity.ok(ApiResponse.success("Fetched volunteer ratings and reviews", ratings));
    }

    @PostMapping
    @PreAuthorize("hasRole('DONOR')")
    public ResponseEntity<ApiResponse<VolunteerRatingDto>> addRating(
            Authentication authentication,
            @PathVariable UUID volunteerId,
            @Valid @RequestBody CreateRatingRequest request
    ) {
        UUID donorUserId = getUserIdFromAuth(authentication);
        VolunteerRatingDto rating = ratingService.addRating(volunteerId, donorUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Rating and review submitted successfully", rating));
    }

    private UUID getUserIdFromAuth(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
        return user.getId();
    }

    @DeleteMapping("/{ratingId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteRating(
            @PathVariable UUID volunteerId,
            @PathVariable UUID ratingId
    ) {
        ratingService.deleteRating(ratingId);
        return ResponseEntity.ok(ApiResponse.success("Rating deleted successfully", null));
    }
}

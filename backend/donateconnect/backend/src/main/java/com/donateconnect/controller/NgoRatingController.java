package com.donateconnect.controller;

import com.donateconnect.dto.ApiResponse;
import com.donateconnect.dto.CreateRatingRequest;
import com.donateconnect.dto.NgoRatingDto;
import com.donateconnect.entity.User;
import com.donateconnect.exception.ResourceNotFoundException;
import com.donateconnect.repository.UserRepository;
import com.donateconnect.service.NgoRatingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ngo/{ngoId}/ratings")
@RequiredArgsConstructor
public class NgoRatingController {

    private final NgoRatingService ratingService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NgoRatingDto>>> getRatings(@PathVariable UUID ngoId) {
        List<NgoRatingDto> ratings = ratingService.getRatingsByNgoId(ngoId);
        return ResponseEntity.ok(ApiResponse.success("Fetched NGO ratings and reviews", ratings));
    }

    @PostMapping
    @PreAuthorize("hasRole('DONOR')")
    public ResponseEntity<ApiResponse<NgoRatingDto>> addRating(
            Authentication authentication,
            @PathVariable UUID ngoId,
            @Valid @RequestBody CreateRatingRequest request
    ) {
        UUID donorUserId = getUserIdFromAuth(authentication);
        NgoRatingDto rating = ratingService.addRating(ngoId, donorUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Rating and review submitted successfully", rating));
    }

    private UUID getUserIdFromAuth(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
        return user.getId();
    }
}

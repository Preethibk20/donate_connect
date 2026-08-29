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
@RequestMapping("/api/ngo/{ngoId}/ratings")
@RequiredArgsConstructor
public class NgoRatingController {

    private final NgoRatingService ratingService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<NgoRatingDto>>> getRatings(
            @PathVariable UUID ngoId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<NgoRatingDto> ratings = ratingService.getRatingsByNgoId(ngoId, pageRequest);
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

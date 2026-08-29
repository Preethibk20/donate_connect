package com.donateconnect.controller;

import com.donateconnect.dto.ApiResponse;
import com.donateconnect.dto.CreateCommentRequest;
import com.donateconnect.dto.DonationCommentDto;
import com.donateconnect.entity.User;
import com.donateconnect.exception.ResourceNotFoundException;
import com.donateconnect.repository.UserRepository;
import com.donateconnect.service.DonationCommentService;
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
@RequestMapping("/api/donations/{donationId}/comments")
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class DonationCommentController {

    private final DonationCommentService commentService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DonationCommentDto>>> getComments(
            Authentication authentication,
            @PathVariable UUID donationId
    ) {
        UUID userId = getUserIdFromAuth(authentication);
        List<DonationCommentDto> comments = commentService.getCommentsByDonationId(donationId, userId);
        return ResponseEntity.ok(ApiResponse.success("Fetched donation comments", comments));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DonationCommentDto>> addComment(
            Authentication authentication,
            @PathVariable UUID donationId,
            @Valid @RequestBody CreateCommentRequest request
    ) {
        UUID userId = getUserIdFromAuth(authentication);
        DonationCommentDto comment = commentService.addComment(donationId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Comment added successfully", comment));
    }

    private UUID getUserIdFromAuth(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
        return user.getId();
    }
}

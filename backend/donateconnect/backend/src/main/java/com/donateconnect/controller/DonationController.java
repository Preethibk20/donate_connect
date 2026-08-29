package com.donateconnect.controller;

import com.donateconnect.dto.ApiResponse;
import com.donateconnect.dto.CreateDonationRequest;
import com.donateconnect.dto.DonationResponseDto;
import com.donateconnect.dto.UpdateDonationStatusDto;
import com.donateconnect.entity.User;
import com.donateconnect.exception.ResourceNotFoundException;
import com.donateconnect.repository.UserRepository;
import com.donateconnect.service.DonationService;
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
@RequestMapping("/api")
@RequiredArgsConstructor
public class DonationController {

    private final DonationService donationService;
    private final UserRepository userRepository;

    @PostMapping("/donations")
    @PreAuthorize("hasRole('DONOR')")
    public ResponseEntity<ApiResponse<DonationResponseDto>> createDonation(
            Authentication authentication,
            @Valid @RequestBody CreateDonationRequest request
    ) {
        UUID donorUserId = getUserIdFromAuth(authentication);
        DonationResponseDto created = donationService.createDonation(donorUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Donation request submitted successfully", created));
    }

    @GetMapping("/donations/mine")
    @PreAuthorize("hasRole('DONOR')")
    public ResponseEntity<ApiResponse<List<DonationResponseDto>>> getMyDonations(Authentication authentication) {
        UUID donorUserId = getUserIdFromAuth(authentication);
        List<DonationResponseDto> donations = donationService.getDonationsByDonor(donorUserId);
        return ResponseEntity.ok(ApiResponse.success("Fetched your donations", donations));
    }

    @GetMapping("/ngo/donations")
    @PreAuthorize("hasRole('NGO')")
    public ResponseEntity<ApiResponse<List<DonationResponseDto>>> getNgoDonations(Authentication authentication) {
        UUID ngoUserId = getUserIdFromAuth(authentication);
        List<DonationResponseDto> donations = donationService.getDonationsByNgoUser(ngoUserId);
        return ResponseEntity.ok(ApiResponse.success("Fetched NGO assigned donations", donations));
    }

    @PatchMapping("/ngo/donations/{id}/status")
    @PreAuthorize("hasRole('NGO')")
    public ResponseEntity<ApiResponse<DonationResponseDto>> updateDonationStatus(
            Authentication authentication,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDonationStatusDto dto
    ) {
        UUID ngoUserId = getUserIdFromAuth(authentication);
        DonationResponseDto updated = donationService.updateDonationStatus(ngoUserId, id, dto.getStatus());
        return ResponseEntity.ok(ApiResponse.success("Donation status updated successfully", updated));
    }

    private UUID getUserIdFromAuth(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user profile not found"));
        return user.getId();
    }
}

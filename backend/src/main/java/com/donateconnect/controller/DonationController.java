package com.donateconnect.controller;

import com.donateconnect.dto.ApiResponse;
import com.donateconnect.dto.CreateDonationRequest;
import com.donateconnect.dto.DonationResponseDto;
import com.donateconnect.dto.UpdateDonationStatusDto;
import com.donateconnect.entity.User;
import com.donateconnect.exception.ResourceNotFoundException;
import com.donateconnect.repository.UserRepository;
import com.donateconnect.service.DonationService;
import com.donateconnect.service.StorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DonationController {

    private final DonationService donationService;
    private final UserRepository userRepository;
    private final StorageService storageService;

    // ==================== DONOR ENDPOINTS ====================

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
    public ResponseEntity<ApiResponse<Page<DonationResponseDto>>> getMyDonations(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        UUID donorUserId = getUserIdFromAuth(authentication);
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<DonationResponseDto> donations = donationService.getDonationsByDonor(donorUserId, pageRequest);
        return ResponseEntity.ok(ApiResponse.success("Fetched your donations", donations));
    }

    @GetMapping("/donations/mine/{id}")
    @PreAuthorize("hasRole('DONOR')")
    public ResponseEntity<ApiResponse<DonationResponseDto>> getMyDonationById(
            Authentication authentication,
            @PathVariable UUID id
    ) {
        UUID donorUserId = getUserIdFromAuth(authentication);
        DonationResponseDto donation = donationService.getDonationByDonorAndId(donorUserId, id);
        return ResponseEntity.ok(ApiResponse.success("Fetched donation detail", donation));
    }

    // ==================== NGO ENDPOINTS ====================

    @GetMapping("/ngo/donations")
    @PreAuthorize("hasRole('NGO')")
    public ResponseEntity<ApiResponse<Page<DonationResponseDto>>> getNgoDonations(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        UUID ngoUserId = getUserIdFromAuth(authentication);
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<DonationResponseDto> donations = donationService.getDonationsByNgoUser(ngoUserId, pageRequest);
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

    // ==================== PHOTO UPLOAD & SERVE (Local Storage) ====================

    /**
     * POST /api/donations/photo
     * Upload a single donation photo. Returns the relative URL to include in photoUrls.
     * Auth required (DONOR role).
     */
    @PostMapping(value = "/donations/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('DONOR')")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadPhoto(
            @RequestParam("file") MultipartFile file
    ) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("No file provided"));
        }

        try {
            String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "photo.jpg";
            String url = storageService.store(file.getBytes(), originalFilename);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Photo uploaded successfully", Map.of("url", url)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to store uploaded file: " + e.getMessage()));
        }
    }

    /**
     * GET /api/donations/photo/{filename}
     * Serve a stored donation photo. Public endpoint (no auth required).
     */
    @GetMapping("/donations/photo/{filename}")
    public ResponseEntity<byte[]> servePhoto(@PathVariable String filename) {
        try {
            byte[] data = storageService.load(filename);
            String contentType = storageService.getContentType(filename);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(data);
        } catch (IOException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // ==================== HELPER ====================

    private UUID getUserIdFromAuth(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user profile not found"));
        return user.getId();
    }
}

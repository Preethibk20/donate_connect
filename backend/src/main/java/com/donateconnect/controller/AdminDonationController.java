package com.donateconnect.controller;

import com.donateconnect.dto.ApiResponse;
import com.donateconnect.dto.DonationResponseDto;
import com.donateconnect.entity.Category;
import com.donateconnect.entity.DonationStatus;
import com.donateconnect.service.DonationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/donations")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminDonationController {

    private final DonationService donationService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<DonationResponseDto>>> getAdminDonations(
            @RequestParam(required = false) Category category,
            @RequestParam(required = false) DonationStatus status,
            @RequestParam(required = false) UUID ngoId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        PageRequest pageable = PageRequest.of(page, size, sort);

        Page<DonationResponseDto> donations = donationService.getAdminDonations(category, status, ngoId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Fetched paginated donations for admin", donations));
    }
}

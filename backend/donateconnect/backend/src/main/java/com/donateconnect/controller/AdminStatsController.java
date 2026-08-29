package com.donateconnect.controller;

import com.donateconnect.dto.AdminStatsDto;
import com.donateconnect.dto.ApiResponse;
import com.donateconnect.entity.DonationStatus;
import com.donateconnect.repository.DonationRepository;
import com.donateconnect.repository.NGOProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/stats")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminStatsController {

    private final DonationRepository donationRepository;
    private final NGOProfileRepository ngoProfileRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<AdminStatsDto>> getAdminStats() {
        long totalDonations = donationRepository.count();
        long verifiedNgos = ngoProfileRepository.countByVerifiedTrue();
        long pendingRequests = donationRepository.countByStatus(DonationStatus.REQUESTED);
        long completedDeliveries = donationRepository.countByStatus(DonationStatus.DELIVERED);

        AdminStatsDto stats = AdminStatsDto.builder()
                .totalDonations(totalDonations)
                .verifiedNgos(verifiedNgos)
                .pendingRequests(pendingRequests)
                .completedDeliveries(completedDeliveries)
                .build();

        return ResponseEntity.ok(ApiResponse.success("Fetched admin statistics successfully", stats));
    }
}

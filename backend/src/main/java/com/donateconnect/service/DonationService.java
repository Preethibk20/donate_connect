package com.donateconnect.service;

import com.donateconnect.dto.CreateDonationRequest;
import com.donateconnect.dto.DonationResponseDto;
import com.donateconnect.entity.Category;
import com.donateconnect.entity.DonationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface DonationService {
    DonationResponseDto createDonation(UUID donorUserId, CreateDonationRequest request);
    Page<DonationResponseDto> getDonationsByDonor(UUID donorUserId, Pageable pageable);
    DonationResponseDto getDonationByDonorAndId(UUID donorUserId, UUID donationId);
    Page<DonationResponseDto> getDonationsByNgoUser(UUID ngoUserId, Pageable pageable);
    DonationResponseDto updateDonationStatus(UUID ngoUserId, UUID donationId, DonationStatus status);
    Page<DonationResponseDto> getAdminDonations(Category category, DonationStatus status, UUID ngoId, Pageable pageable);
}

package com.donateconnect.service;

import com.donateconnect.dto.CreateDonationRequest;
import com.donateconnect.dto.DonationResponseDto;
import com.donateconnect.entity.Category;
import com.donateconnect.entity.DonationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface DonationService {
    DonationResponseDto createDonation(UUID donorUserId, CreateDonationRequest request);
    List<DonationResponseDto> getDonationsByDonor(UUID donorUserId);
    List<DonationResponseDto> getDonationsByNgoUser(UUID ngoUserId);
    DonationResponseDto updateDonationStatus(UUID ngoUserId, UUID donationId, DonationStatus status);
    Page<DonationResponseDto> getAdminDonations(Category category, DonationStatus status, UUID ngoId, Pageable pageable);
}

package com.donateconnect.service;

import com.donateconnect.dto.CreateCommentRequest;
import com.donateconnect.dto.DonationCommentDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface DonationCommentService {
    Page<DonationCommentDto> getCommentsByDonationId(UUID donationId, UUID currentUserId, Pageable pageable);
    DonationCommentDto addComment(UUID donationId, UUID currentUserId, CreateCommentRequest request);
}

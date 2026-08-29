package com.donateconnect.service;

import com.donateconnect.dto.CreateCommentRequest;
import com.donateconnect.dto.DonationCommentDto;

import java.util.List;
import java.util.UUID;

public interface DonationCommentService {
    List<DonationCommentDto> getCommentsByDonationId(UUID donationId, UUID currentUserId);
    DonationCommentDto addComment(UUID donationId, UUID currentUserId, CreateCommentRequest request);
}

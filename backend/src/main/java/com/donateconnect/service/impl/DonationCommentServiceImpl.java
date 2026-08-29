package com.donateconnect.service.impl;

import com.donateconnect.dto.CreateCommentRequest;
import com.donateconnect.dto.DonationCommentDto;
import com.donateconnect.dto.UserResponseDto;
import com.donateconnect.entity.Donation;
import com.donateconnect.entity.DonationComment;
import com.donateconnect.entity.User;
import com.donateconnect.exception.ResourceNotFoundException;
import com.donateconnect.repository.DonationCommentRepository;
import com.donateconnect.repository.DonationRepository;
import com.donateconnect.repository.UserRepository;
import com.donateconnect.service.DonationCommentService;
import com.donateconnect.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DonationCommentServiceImpl implements DonationCommentService {

    private final DonationCommentRepository commentRepository;
    private final DonationRepository donationRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public Page<DonationCommentDto> getCommentsByDonationId(UUID donationId, UUID currentUserId, Pageable pageable) {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new ResourceNotFoundException("Donation not found with id: " + donationId));

        verifyAccess(donation, currentUserId);

        return commentRepository.findByDonationIdOrderByCreatedAtAsc(donationId, pageable)
                .map(this::mapToDto);
    }

    @Override
    @Transactional
    public DonationCommentDto addComment(UUID donationId, UUID currentUserId, CreateCommentRequest request) {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new ResourceNotFoundException("Donation not found with id: " + donationId));

        verifyAccess(donation, currentUserId);

        User author = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUserId));

        DonationComment comment = DonationComment.builder()
                .donation(donation)
                .author(author)
                .message(request.getMessage())
                .build();

        DonationComment saved = commentRepository.save(comment);

        // Notify recipient (if author is donor -> notify NGO user; if author is NGO -> notify donor)
        User recipient = author.getId().equals(donation.getDonor().getId())
                ? donation.getNgo().getUser()
                : donation.getDonor();

        notificationService.createNotification(
                recipient,
                "New comment on donation (" + donation.getCategory() + ") from " + author.getFullName() + ": " + request.getMessage(),
                donation.getId()
        );

        return mapToDto(saved);
    }

    private void verifyAccess(Donation donation, UUID userId) {
        boolean isDonor = donation.getDonor().getId().equals(userId);
        boolean isNgo = donation.getNgo().getUser().getId().equals(userId);
        User user = userRepository.findById(userId).orElse(null);
        boolean isAdmin = user != null && user.getRole().name().equals("ADMIN");

        if (!isDonor && !isNgo && !isAdmin) {
            throw new AccessDeniedException("Forbidden: You do not have permission to view or post comments on this donation.");
        }
    }

    private DonationCommentDto mapToDto(DonationComment c) {
        User author = c.getAuthor();
        UserResponseDto authorDto = UserResponseDto.builder()
                .id(author.getId())
                .email(author.getEmail())
                .fullName(author.getFullName())
                .role(author.getRole())
                .createdAt(author.getCreatedAt())
                .build();

        return DonationCommentDto.builder()
                .id(c.getId())
                .donationId(c.getDonation().getId())
                .author(authorDto)
                .message(c.getMessage())
                .createdAt(c.getCreatedAt())
                .build();
    }
}

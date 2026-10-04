package com.donateconnect.service.impl;

import com.donateconnect.dto.NotificationDto;
import com.donateconnect.entity.Notification;
import com.donateconnect.entity.User;
import com.donateconnect.exception.ResourceNotFoundException;
import com.donateconnect.repository.NotificationRepository;
import com.donateconnect.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final com.donateconnect.service.EmailService emailService;

    @Override
    @Transactional
    public void createNotification(User recipient, String message, UUID relatedDonationId) {
        notifyUser(recipient, message, relatedDonationId, false);
    }

    @Override
    @Transactional
    public void notifyUser(User recipient, String message, UUID relatedDonationId, boolean sendEmail) {
        Notification notification = Notification.builder()
                .recipientUser(recipient)
                .message(message)
                .read(false)
                .relatedDonationId(relatedDonationId)
                .build();
        notificationRepository.save(notification);

        if (sendEmail && recipient.getEmail() != null) {
            String subject = "DonateConnect: Update on Donation";
            String body = "Hello " + recipient.getFullName() + ",\n\n" + message + "\n\nThank you,\nDonateConnect Team";
            emailService.sendNotificationEmail(recipient.getEmail(), subject, body);
        }
        
        // TODO: Add push notification logic here in the future
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationDto> getUserNotifications(UUID userId, Pageable pageable) {
        return notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::mapToDto);
    }

    @Override
    @Transactional
    public void markAsRead(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));

        if (!notification.getRecipientUser().getId().equals(userId)) {
            throw new AccessDeniedException("You are not authorized to mark this notification as read");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByRecipientUserIdAndReadFalse(userId);
    }

    private NotificationDto mapToDto(Notification notification) {
        return NotificationDto.builder()
                .id(notification.getId())
                .message(notification.getMessage())
                .read(notification.isRead())
                .relatedDonationId(notification.getRelatedDonationId())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}

package com.donateconnect.service;

import com.donateconnect.dto.NotificationDto;
import com.donateconnect.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface NotificationService {
    void createNotification(User recipient, String message, UUID relatedDonationId);
    void notifyUser(User recipient, String message, UUID relatedDonationId, boolean sendEmail);
    Page<NotificationDto> getUserNotifications(UUID userId, Pageable pageable);
    void markAsRead(UUID notificationId, UUID userId);
    long getUnreadCount(UUID userId);
}

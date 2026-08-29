package com.donateconnect.service;

import com.donateconnect.dto.NotificationDto;
import com.donateconnect.entity.User;

import java.util.List;
import java.util.UUID;

public interface NotificationService {
    void createNotification(User recipient, String message, UUID relatedDonationId);
    List<NotificationDto> getUserNotifications(UUID userId);
    void markAsRead(UUID notificationId, UUID userId);
}

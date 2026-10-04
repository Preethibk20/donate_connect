package com.donateconnect.service;

import com.donateconnect.dto.DeliveryDto;
import com.donateconnect.entity.DeliveryStatus;

import java.util.UUID;

public interface DeliveryService {
    DeliveryDto updateDeliveryStatus(UUID volunteerId, UUID deliveryId, DeliveryStatus newStatus);
    DeliveryDto completeDelivery(UUID volunteerId, UUID deliveryId, String otp, org.springframework.web.multipart.MultipartFile proofImage);
}

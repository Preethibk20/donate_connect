package com.donateconnect.dto;

import com.donateconnect.entity.DeliveryStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryDto {
    private UUID id;
    private UUID donationId;
    private UUID volunteerId;
    private DeliveryStatus status;
    private LocalDateTime assignedAt;
    private LocalDateTime pickedUpAt;
    private LocalDateTime deliveredAt;
    private Double lastLat;
    private Double lastLng;
    private LocalDateTime lastLocationAt;

    private String proofImageUrl;
}

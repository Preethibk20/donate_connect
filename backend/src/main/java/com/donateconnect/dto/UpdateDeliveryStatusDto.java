package com.donateconnect.dto;

import com.donateconnect.entity.DeliveryStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateDeliveryStatusDto {
    @NotNull(message = "Status is required")
    private DeliveryStatus status;
}

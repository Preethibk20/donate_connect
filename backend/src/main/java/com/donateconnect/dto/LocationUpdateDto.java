package com.donateconnect.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class LocationUpdateDto {
    private UUID deliveryId;
    private Double lat;
    private Double lng;
    private Double speed;
    private Double heading;
    private LocalDateTime timestamp;
}

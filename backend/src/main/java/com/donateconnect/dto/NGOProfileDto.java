package com.donateconnect.dto;

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
public class NGOProfileDto {
    private UUID id;
    private UserResponseDto user;
    private String name;
    private String description;
    private String address;
    private String city;
    private String phone;
    private Double latitude;
    private Double longitude;
    private Double distanceKm; // Added for frontend distance display
    private java.util.List<NgoUrgentNeedDto> urgentNeeds;
    private boolean verified;
    private Double averageRating;
    private Integer ratingCount;
    private LocalDateTime createdAt;
}

package com.donateconnect.dto;

import com.donateconnect.entity.Category;
import com.donateconnect.entity.DonationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DonationResponseDto {
    private UUID id;
    private UserResponseDto donor;
    private NGOProfileDto ngo;
    private Category category;
    private String description;
    private List<String> photoUrls;
    private DonationStatus status;
    private LocalDate pickupDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

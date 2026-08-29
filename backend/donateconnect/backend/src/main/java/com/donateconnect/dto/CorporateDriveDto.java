package com.donateconnect.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CorporateDriveDto {
    private UUID id;
    private UserResponseDto corporateUser;
    private String companyName;
    private String campaignTitle;
    private String description;
    private int targetItemCount;
    private int collectedItemCount;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDateTime createdAt;
}

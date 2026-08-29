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
public class NgoRatingDto {
    private UUID id;
    private UUID ngoId;
    private UserResponseDto donor;
    private int rating;
    private String review;
    private LocalDateTime createdAt;
}

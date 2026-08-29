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
public class DonationCommentDto {
    private UUID id;
    private UUID donationId;
    private UserResponseDto author;
    private String message;
    private LocalDateTime createdAt;
}

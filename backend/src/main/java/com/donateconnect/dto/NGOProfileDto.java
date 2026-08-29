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
    private String phone;
    private boolean verified;
    private LocalDateTime createdAt;
}

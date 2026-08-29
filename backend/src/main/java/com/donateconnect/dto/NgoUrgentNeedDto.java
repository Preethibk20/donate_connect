package com.donateconnect.dto;

import com.donateconnect.entity.Category;
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
public class NgoUrgentNeedDto {
    private UUID id;
    private NGOProfileDto ngo;
    private String title;
    private String description;
    private Category category;
    private boolean active;
    private LocalDateTime createdAt;
}

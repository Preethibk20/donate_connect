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
public class NgoUrgentNeedPublicDto {
    private UUID id;
    private String title;
    private String description;
    private Category category;
    private Integer quantity;
    private boolean active;
    private LocalDateTime createdAt;
    
    // Scrubbed NGO Profile
    private UUID ngoId;
    private String ngoName;
    private String ngoCity;
    private boolean ngoVerified;
}

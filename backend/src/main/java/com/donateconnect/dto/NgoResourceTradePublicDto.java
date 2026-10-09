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
public class NgoResourceTradePublicDto {
    private UUID id;
    
    // Scrubbed NGO Profile (No email, phone, user id, or precise address)
    private UUID ngoId;
    private String ngoName;
    private String ngoCity;
    private boolean ngoVerified;
    
    private Category offeredCategory;
    private int offeredQuantity;
    private Category requestedCategory;
    private int requestedQuantity;
    private boolean active;
    private LocalDateTime createdAt;
}

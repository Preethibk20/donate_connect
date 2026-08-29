package com.donateconnect.dto;

import com.donateconnect.entity.Category;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateDonationRequest {

    @NotNull(message = "Target NGO ID is required")
    private UUID ngoId;

    @NotNull(message = "Category is required")
    private Category category;

    private String description;

    private List<String> photoUrls;

    private LocalDate pickupDate;
}

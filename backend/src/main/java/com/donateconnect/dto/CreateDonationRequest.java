package com.donateconnect.dto;

import com.donateconnect.entity.Category;
import jakarta.validation.constraints.*;
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

    @NotBlank(message = "Description is required")
    @Size(min = 20, max = 2000, message = "Description must be between 20 and 2000 characters")
    private String description;

    @Size(max = 10, message = "Cannot upload more than 10 photos per donation")
    private List<String> photoUrls;

    @FutureOrPresent(message = "Pickup date must be today or in the future")
    private LocalDate pickupDate;
}

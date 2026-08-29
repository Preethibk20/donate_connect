package com.donateconnect.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DonationDto {

    private Long id;

    @NotBlank(message = "Title is required")
    @Size(max = 150, message = "Title cannot exceed 150 characters")
    private String title;

    private String description;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be greater than zero")
    private BigDecimal amount;

    @NotBlank(message = "Donor name is required")
    @Size(max = 100, message = "Donor name cannot exceed 100 characters")
    private String donorName;

    @NotBlank(message = "Donor email is required")
    @Email(message = "Donor email must be a valid email address")
    private String donorEmail;

    @NotBlank(message = "Category is required")
    private String category;

    private String status;

    private LocalDateTime createdAt;
}

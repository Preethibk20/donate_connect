package com.donateconnect.dto;

import com.donateconnect.entity.DonationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDonationStatusDto {

    @NotNull(message = "Status is required")
    private DonationStatus status;
}

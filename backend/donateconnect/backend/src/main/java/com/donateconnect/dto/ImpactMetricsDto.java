package com.donateconnect.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImpactMetricsDto {
    private long totalDonations;
    private long deliveredDonations;
    private long totalNgosSupported;
    private long totalActiveDonors;
    private double estimatedCo2SavedKg;
    private Map<String, Long> donationsByCategory;
}

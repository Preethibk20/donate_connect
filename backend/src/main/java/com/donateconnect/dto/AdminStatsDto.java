package com.donateconnect.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsDto {
    private long totalDonations;
    private long verifiedNgos;
    private long pendingRequests;
    private long completedDeliveries;

    private Map<String, Long> donationsByDate;
    private Map<String, Long> donationsByCategory;
    private Map<String, Long> donationsByCity;
    private double deliverySuccessRate;
    private double averageDeliveryTimeHours;
    
    private List<Map<String, Object>> topDonors;
    private List<Map<String, Object>> topNgos;
}

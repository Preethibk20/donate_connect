package com.donateconnect.controller;

import com.donateconnect.dto.AdminStatsDto;
import com.donateconnect.dto.ApiResponse;
import com.donateconnect.entity.Donation;
import com.donateconnect.entity.DonationStatus;
import com.donateconnect.entity.Delivery;
import com.donateconnect.repository.DonationRepository;
import com.donateconnect.repository.DeliveryRepository;
import com.donateconnect.repository.NGOProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/stats")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminStatsController {

    private final DonationRepository donationRepository;
    private final DeliveryRepository deliveryRepository;
    private final NGOProfileRepository ngoProfileRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<AdminStatsDto>> getAdminStats() {
        List<Donation> allDonations = donationRepository.findAll();
        List<Delivery> allDeliveries = deliveryRepository.findAll();

        long totalDonations = allDonations.size();
        long verifiedNgos = ngoProfileRepository.countByVerifiedTrue();
        long pendingRequests = allDonations.stream().filter(d -> d.getStatus() == DonationStatus.REQUESTED).count();
        long completedDeliveries = allDonations.stream().filter(d -> d.getStatus() == DonationStatus.DELIVERED).count();

        // 1. Donations Over Time (Last 30 Days)
        Map<String, Long> donationsByDate = allDonations.stream()
                .filter(d -> d.getCreatedAt() != null)
                .collect(Collectors.groupingBy(
                        d -> d.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE),
                        Collectors.counting()
                ));
        // Sort it
        donationsByDate = donationsByDate.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (e1, e2) -> e1, LinkedHashMap::new));

        // 2. Donations by Category
        Map<String, Long> donationsByCategory = allDonations.stream()
                .collect(Collectors.groupingBy(d -> d.getCategory().name(), Collectors.counting()));

        // 3. Donations by City
        Map<String, Long> donationsByCity = allDonations.stream()
                .filter(d -> d.getNgo() != null && d.getNgo().getCity() != null)
                .collect(Collectors.groupingBy(d -> d.getNgo().getCity(), Collectors.counting()));

        // 4. Delivery Success Rate
        long totalAssigned = allDeliveries.size();
        long successfulDeliveries = allDeliveries.stream()
                .filter(d -> d.getDeliveredAt() != null).count();
        double deliverySuccessRate = totalAssigned > 0 ? ((double) successfulDeliveries / totalAssigned) * 100.0 : 0.0;

        // 5. Average Delivery Time (Picked Up to Delivered in Hours)
        List<Delivery> delivered = allDeliveries.stream()
                .filter(d -> d.getPickedUpAt() != null && d.getDeliveredAt() != null).toList();
        
        double averageDeliveryTimeHours = 0.0;
        if (!delivered.isEmpty()) {
            double totalHours = delivered.stream()
                    .mapToDouble(d -> Duration.between(d.getPickedUpAt(), d.getDeliveredAt()).toMinutes() / 60.0)
                    .sum();
            averageDeliveryTimeHours = totalHours / delivered.size();
        }

        // 6. Top Donors
        Map<String, Long> donorCounts = allDonations.stream()
                .collect(Collectors.groupingBy(d -> d.getDonor().getFullName(), Collectors.counting()));
        List<Map<String, Object>> topDonors = donorCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(e -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("name", e.getKey());
                    map.put("donations", e.getValue());
                    return map;
                }).collect(Collectors.toList());

        // 7. Top NGOs
        Map<String, Long> ngoCounts = allDonations.stream()
                .collect(Collectors.groupingBy(d -> d.getNgo().getName(), Collectors.counting()));
        List<Map<String, Object>> topNgos = ngoCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(e -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("name", e.getKey());
                    map.put("donations", e.getValue());
                    return map;
                }).collect(Collectors.toList());

        AdminStatsDto stats = AdminStatsDto.builder()
                .totalDonations(totalDonations)
                .verifiedNgos(verifiedNgos)
                .pendingRequests(pendingRequests)
                .completedDeliveries(completedDeliveries)
                .donationsByDate(donationsByDate)
                .donationsByCategory(donationsByCategory)
                .donationsByCity(donationsByCity)
                .deliverySuccessRate(deliverySuccessRate)
                .averageDeliveryTimeHours(averageDeliveryTimeHours)
                .topDonors(topDonors)
                .topNgos(topNgos)
                .build();

        return ResponseEntity.ok(ApiResponse.success("Fetched admin statistics successfully", stats));
    }
}

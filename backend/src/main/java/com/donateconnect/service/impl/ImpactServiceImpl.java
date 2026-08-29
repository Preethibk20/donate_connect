package com.donateconnect.service.impl;

import com.donateconnect.dto.ImpactMetricsDto;
import com.donateconnect.entity.Category;
import com.donateconnect.entity.DonationStatus;
import com.donateconnect.entity.Role;
import com.donateconnect.repository.DonationRepository;
import com.donateconnect.repository.NGOProfileRepository;
import com.donateconnect.repository.UserRepository;
import com.donateconnect.service.ImpactService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ImpactServiceImpl implements ImpactService {

    private final DonationRepository donationRepository;
    private final NGOProfileRepository ngoProfileRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public ImpactMetricsDto getPublicImpactMetrics() {
        long totalDonations = donationRepository.count();
        long deliveredDonations = donationRepository.countByStatus(DonationStatus.DELIVERED);
        long totalNgos = ngoProfileRepository.countByVerifiedTrue();
        long totalDonors = userRepository.countByRole(Role.DONOR);

        Map<String, Long> categoryCounts = new HashMap<>();
        for (Category c : Category.values()) {
            long count = donationRepository.countByCategory(c);
            categoryCounts.put(c.name(), count);
        }

        // CO2 Savings heuristic: Average 4.5 kg CO2 saved per recycled/donated item batch
        double co2Saved = (totalDonations * 4.5);

        return ImpactMetricsDto.builder()
                .totalDonations(totalDonations)
                .deliveredDonations(deliveredDonations)
                .totalNgosSupported(totalNgos)
                .totalActiveDonors(totalDonors)
                .estimatedCo2SavedKg(Math.round(co2Saved * 10.0) / 10.0)
                .donationsByCategory(categoryCounts)
                .build();
    }
}

package com.donateconnect.controller;

import com.donateconnect.dto.ApiResponse;
import com.donateconnect.dto.ImpactMetricsDto;
import com.donateconnect.service.ImpactService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/impact")
@RequiredArgsConstructor
public class ImpactController {

    private final ImpactService impactService;

    @GetMapping
    public ResponseEntity<ApiResponse<ImpactMetricsDto>> getImpactMetrics() {
        ImpactMetricsDto metrics = impactService.getPublicImpactMetrics();
        return ResponseEntity.ok(ApiResponse.success("Fetched global impact metrics", metrics));
    }
}

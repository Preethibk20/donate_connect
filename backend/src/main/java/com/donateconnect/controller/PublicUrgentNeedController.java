package com.donateconnect.controller;

import com.donateconnect.dto.ApiResponse;
import com.donateconnect.dto.NgoUrgentNeedDto;
import com.donateconnect.service.NgoUrgentNeedService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/urgent-needs")
@RequiredArgsConstructor
public class PublicUrgentNeedController {

    private final NgoUrgentNeedService urgentNeedService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<com.donateconnect.dto.NgoUrgentNeedPublicDto>>> getActiveUrgentNeeds() {
        List<com.donateconnect.dto.NgoUrgentNeedPublicDto> needs = urgentNeedService.getActiveUrgentNeeds().stream()
            .map(dto -> com.donateconnect.dto.NgoUrgentNeedPublicDto.builder()
                .id(dto.getId())
                .title(dto.getTitle())
                .description(dto.getDescription())
                .category(dto.getCategory())
                .quantity(dto.getQuantity())
                .active(dto.isActive())
                .createdAt(dto.getCreatedAt())
                .ngoId(dto.getNgo().getId())
                .ngoName(dto.getNgo().getName())
                .ngoCity(dto.getNgo().getCity())
                .ngoVerified(dto.getNgo().isVerified())
                .build())
            .toList();
        return ResponseEntity.ok(ApiResponse.success("Fetched active urgent donation campaigns", needs));
    }
}

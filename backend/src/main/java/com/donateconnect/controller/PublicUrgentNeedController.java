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
    public ResponseEntity<ApiResponse<List<NgoUrgentNeedDto>>> getActiveUrgentNeeds() {
        List<NgoUrgentNeedDto> needs = urgentNeedService.getActiveUrgentNeeds();
        return ResponseEntity.ok(ApiResponse.success("Fetched active urgent donation campaigns", needs));
    }
}

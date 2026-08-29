package com.donateconnect.controller;

import com.donateconnect.dto.ApiResponse;
import com.donateconnect.dto.CreateNgoRequest;
import com.donateconnect.dto.NGOProfileDto;
import com.donateconnect.service.NGOService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/ngo")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminNGOController {

    private final NGOService ngoService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NGOProfileDto>>> getAllNgos() {
        List<NGOProfileDto> ngos = ngoService.getAllNgosForAdmin();
        return ResponseEntity.ok(ApiResponse.success("Fetched all NGO profiles for admin", ngos));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<NGOProfileDto>> createNgo(@Valid @RequestBody CreateNgoRequest request) {
        NGOProfileDto created = ngoService.createNgo(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("NGO user and profile created successfully", created));
    }

    @PatchMapping("/{id}/verify")
    public ResponseEntity<ApiResponse<NGOProfileDto>> setVerifiedStatus(
            @PathVariable UUID id,
            @RequestParam boolean verified
    ) {
        NGOProfileDto updated = ngoService.setVerifiedStatus(id, verified);
        return ResponseEntity.ok(ApiResponse.success("NGO verification status updated", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNgo(@PathVariable UUID id) {
        ngoService.deleteNgo(id);
        return ResponseEntity.ok(ApiResponse.success("NGO profile and user deleted successfully", null));
    }
}

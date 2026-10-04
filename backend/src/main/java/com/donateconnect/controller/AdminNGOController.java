package com.donateconnect.controller;

import com.donateconnect.dto.ApiResponse;
import com.donateconnect.dto.CreateNgoRequest;
import com.donateconnect.dto.NGOProfileDto;
import com.donateconnect.service.NGOService;
import com.donateconnect.service.AuditLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/ngo")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminNGOController {

    private final NGOService ngoService;
    private final AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<NGOProfileDto>>> getAllNgos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<NGOProfileDto> ngos = ngoService.getAllNgosForAdmin(PageRequest.of(page, size));
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
        auditLogService.logAction(verified ? "VERIFY_NGO" : "UNVERIFY_NGO", "NGO", id.toString(), "Set verification status to " + verified + " for NGO " + updated.getName());
        return ResponseEntity.ok(ApiResponse.success("NGO verification status updated", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNgo(@PathVariable UUID id) {
        ngoService.deleteNgo(id);
        return ResponseEntity.ok(ApiResponse.success("NGO profile and user deleted successfully", null));
    }
}

package com.donateconnect.controller;

import com.donateconnect.dto.ApiResponse;
import com.donateconnect.dto.NGOProfileDto;
import com.donateconnect.dto.UpdateNgoProfileDto;
import com.donateconnect.entity.User;
import com.donateconnect.exception.ResourceNotFoundException;
import com.donateconnect.repository.UserRepository;
import com.donateconnect.service.NGOService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ngo")
@RequiredArgsConstructor
public class NGOController {

    private final NGOService ngoService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NGOProfileDto>>> getVerifiedNgos() {
        List<NGOProfileDto> ngos = ngoService.getAllVerifiedNgos();
        return ResponseEntity.ok(ApiResponse.success("Fetched verified NGO profiles", ngos));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<NGOProfileDto>> getNgoById(@PathVariable UUID id) {
        NGOProfileDto ngo = ngoService.getNgoById(id);
        return ResponseEntity.ok(ApiResponse.success("Fetched NGO profile details", ngo));
    }

    @GetMapping("/me/profile")
    @PreAuthorize("hasRole('NGO')")
    public ResponseEntity<ApiResponse<NGOProfileDto>> getOwnProfile(Authentication authentication) {
        UUID userId = getUserIdFromAuth(authentication);
        NGOProfileDto profile = ngoService.getNgoProfileByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success("Fetched own NGO profile", profile));
    }

    @PatchMapping("/me/profile")
    @PreAuthorize("hasRole('NGO')")
    public ResponseEntity<ApiResponse<NGOProfileDto>> updateOwnProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateNgoProfileDto dto
    ) {
        UUID userId = getUserIdFromAuth(authentication);
        NGOProfileDto updated = ngoService.updateOwnProfile(userId, dto);
        return ResponseEntity.ok(ApiResponse.success("Updated own NGO profile", updated));
    }

    private UUID getUserIdFromAuth(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
        return user.getId();
    }
}

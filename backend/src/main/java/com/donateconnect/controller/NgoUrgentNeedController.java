package com.donateconnect.controller;

import com.donateconnect.dto.ApiResponse;
import com.donateconnect.dto.CreateUrgentNeedRequest;
import com.donateconnect.dto.NgoUrgentNeedDto;
import com.donateconnect.entity.User;
import com.donateconnect.exception.ResourceNotFoundException;
import com.donateconnect.repository.UserRepository;
import com.donateconnect.service.NgoUrgentNeedService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ngo/urgent-needs")
@PreAuthorize("hasRole('NGO')")
@RequiredArgsConstructor
public class NgoUrgentNeedController {

    private final NgoUrgentNeedService urgentNeedService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NgoUrgentNeedDto>>> getOwnUrgentNeeds(Authentication authentication) {
        UUID ngoUserId = getUserIdFromAuth(authentication);
        List<NgoUrgentNeedDto> needs = urgentNeedService.getUrgentNeedsByNgoUser(ngoUserId);
        return ResponseEntity.ok(ApiResponse.success("Fetched NGO urgent needs", needs));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<NgoUrgentNeedDto>> createUrgentNeed(
            Authentication authentication,
            @Valid @RequestBody CreateUrgentNeedRequest request
    ) {
        UUID ngoUserId = getUserIdFromAuth(authentication);
        NgoUrgentNeedDto need = urgentNeedService.createUrgentNeed(ngoUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Urgent need request posted successfully", need));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<NgoUrgentNeedDto>> toggleUrgentNeed(
            Authentication authentication,
            @PathVariable UUID id
    ) {
        UUID ngoUserId = getUserIdFromAuth(authentication);
        NgoUrgentNeedDto toggled = urgentNeedService.toggleUrgentNeed(ngoUserId, id);
        return ResponseEntity.ok(ApiResponse.success("Toggled urgent need status", toggled));
    }

    private UUID getUserIdFromAuth(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
        return user.getId();
    }
}

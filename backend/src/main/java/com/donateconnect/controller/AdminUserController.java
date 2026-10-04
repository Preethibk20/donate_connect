package com.donateconnect.controller;

import com.donateconnect.dto.ApiResponse;
import com.donateconnect.dto.UserResponseDto;
import com.donateconnect.entity.User;
import com.donateconnect.repository.UserRepository;
import com.donateconnect.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<Page<UserResponseDto>>> getPendingUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<UserResponseDto> pending = userRepository.findByApprovedFalse(PageRequest.of(page, size))
                .map(this::mapToDto);
        return ResponseEntity.ok(ApiResponse.success("Fetched pending user approvals", pending));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<UserResponseDto>> approveUser(@PathVariable UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setApproved(true);
        User saved = userRepository.save(user);
        auditLogService.logAction("APPROVE_USER", "USER", saved.getId().toString(), "Approved user account for " + saved.getEmail());
        return ResponseEntity.ok(ApiResponse.success("User approved successfully", mapToDto(saved)));
    }

    private UserResponseDto mapToDto(User user) {
        return UserResponseDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}

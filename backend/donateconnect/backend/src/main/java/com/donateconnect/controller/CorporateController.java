package com.donateconnect.controller;

import com.donateconnect.dto.ApiResponse;
import com.donateconnect.dto.CorporateDriveDto;
import com.donateconnect.dto.UserResponseDto;
import com.donateconnect.entity.CorporateDrive;
import com.donateconnect.entity.User;
import com.donateconnect.exception.ResourceNotFoundException;
import com.donateconnect.repository.CorporateDriveRepository;
import com.donateconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/corporate")
@PreAuthorize("hasAnyRole('CORPORATE', 'ADMIN')")
@RequiredArgsConstructor
public class CorporateController {

    private final CorporateDriveRepository corporateDriveRepository;
    private final UserRepository userRepository;

    @GetMapping("/drives")
    public ResponseEntity<ApiResponse<List<CorporateDriveDto>>> getCorporateDrives(Authentication authentication) {
        User user = getAuthUser(authentication);
        List<CorporateDriveDto> drives = corporateDriveRepository.findByCorporateUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Fetched corporate CSR drives", drives));
    }

    private User getAuthUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private CorporateDriveDto mapToDto(CorporateDrive d) {
        User u = d.getCorporateUser();
        UserResponseDto uDto = UserResponseDto.builder()
                .id(u.getId())
                .email(u.getEmail())
                .fullName(u.getFullName())
                .role(u.getRole())
                .createdAt(u.getCreatedAt())
                .build();

        return CorporateDriveDto.builder()
                .id(d.getId())
                .corporateUser(uDto)
                .companyName(d.getCompanyName())
                .campaignTitle(d.getCampaignTitle())
                .description(d.getDescription())
                .targetItemCount(d.getTargetItemCount())
                .collectedItemCount(d.getCollectedItemCount())
                .startDate(d.getStartDate())
                .endDate(d.getEndDate())
                .createdAt(d.getCreatedAt())
                .build();
    }
}

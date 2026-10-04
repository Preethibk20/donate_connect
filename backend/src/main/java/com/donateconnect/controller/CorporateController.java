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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

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
    public ResponseEntity<ApiResponse<Page<CorporateDriveDto>>> getCorporateDrives(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        User user = getAuthUser(authentication);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<CorporateDriveDto> drives = corporateDriveRepository.findByCorporateUserIdOrderByCreatedAtDesc(user.getId(), pageable)
                .map(this::mapToDto);
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
    @PostMapping("/drives")
    public ResponseEntity<ApiResponse<CorporateDriveDto>> createCorporateDrive(
            @Valid @RequestBody CorporateDriveDto dto,
            Authentication authentication) {
        User user = getAuthUser(authentication);
        
        CorporateDrive drive = CorporateDrive.builder()
                .corporateUser(user)
                .companyName(dto.getCompanyName())
                .campaignTitle(dto.getCampaignTitle())
                .description(dto.getDescription())
                .targetItemCount(dto.getTargetItemCount())
                .collectedItemCount(0) // Start at 0
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .build();
                
        CorporateDrive saved = corporateDriveRepository.save(drive);
        return ResponseEntity.ok(ApiResponse.success("Created corporate CSR drive", mapToDto(saved)));
    }
}

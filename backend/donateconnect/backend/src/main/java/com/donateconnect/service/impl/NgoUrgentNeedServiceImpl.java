package com.donateconnect.service.impl;

import com.donateconnect.dto.CreateUrgentNeedRequest;
import com.donateconnect.dto.NGOProfileDto;
import com.donateconnect.dto.NgoUrgentNeedDto;
import com.donateconnect.dto.UserResponseDto;
import com.donateconnect.entity.NGOProfile;
import com.donateconnect.entity.NgoUrgentNeed;
import com.donateconnect.entity.User;
import com.donateconnect.exception.ResourceNotFoundException;
import com.donateconnect.repository.NGOProfileRepository;
import com.donateconnect.repository.NgoUrgentNeedRepository;
import com.donateconnect.service.NgoUrgentNeedService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NgoUrgentNeedServiceImpl implements NgoUrgentNeedService {

    private final NgoUrgentNeedRepository urgentNeedRepository;
    private final NGOProfileRepository ngoProfileRepository;

    @Override
    @Transactional(readOnly = true)
    public List<NgoUrgentNeedDto> getActiveUrgentNeeds() {
        return urgentNeedRepository.findByActiveTrueOrderByCreatedAtDesc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<NgoUrgentNeedDto> getUrgentNeedsByNgoUser(UUID ngoUserId) {
        NGOProfile ngo = ngoProfileRepository.findByUserId(ngoUserId)
                .orElseThrow(() -> new ResourceNotFoundException("NGO profile not found for user: " + ngoUserId));

        return urgentNeedRepository.findByNgoIdOrderByCreatedAtDesc(ngo.getId()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public NgoUrgentNeedDto createUrgentNeed(UUID ngoUserId, CreateUrgentNeedRequest request) {
        NGOProfile ngo = ngoProfileRepository.findByUserId(ngoUserId)
                .orElseThrow(() -> new ResourceNotFoundException("NGO profile not found for user: " + ngoUserId));

        if (!ngo.isVerified()) {
            throw new IllegalArgumentException("Unverified NGOs cannot post urgent needs");
        }

        NgoUrgentNeed urgentNeed = NgoUrgentNeed.builder()
                .ngo(ngo)
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .active(true)
                .build();

        NgoUrgentNeed saved = urgentNeedRepository.save(urgentNeed);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public NgoUrgentNeedDto toggleUrgentNeed(UUID ngoUserId, UUID urgentNeedId) {
        NGOProfile ngo = ngoProfileRepository.findByUserId(ngoUserId)
                .orElseThrow(() -> new ResourceNotFoundException("NGO profile not found for user: " + ngoUserId));

        NgoUrgentNeed urgentNeed = urgentNeedRepository.findById(urgentNeedId)
                .orElseThrow(() -> new ResourceNotFoundException("Urgent need not found with id: " + urgentNeedId));

        if (!urgentNeed.getNgo().getId().equals(ngo.getId())) {
            throw new AccessDeniedException("Forbidden: You do not own this urgent need campaign");
        }

        urgentNeed.setActive(!urgentNeed.isActive());
        NgoUrgentNeed saved = urgentNeedRepository.save(urgentNeed);
        return mapToDto(saved);
    }

    private NgoUrgentNeedDto mapToDto(NgoUrgentNeed u) {
        NGOProfile ngo = u.getNgo();
        User ngoUser = ngo.getUser();
        UserResponseDto ngoUserDto = UserResponseDto.builder()
                .id(ngoUser.getId())
                .email(ngoUser.getEmail())
                .fullName(ngoUser.getFullName())
                .role(ngoUser.getRole())
                .createdAt(ngoUser.getCreatedAt())
                .build();

        NGOProfileDto ngoDto = NGOProfileDto.builder()
                .id(ngo.getId())
                .user(ngoUserDto)
                .name(ngo.getName())
                .description(ngo.getDescription())
                .address(ngo.getAddress())
                .phone(ngo.getPhone())
                .verified(ngo.isVerified())
                .createdAt(ngo.getCreatedAt())
                .build();

        return NgoUrgentNeedDto.builder()
                .id(u.getId())
                .ngo(ngoDto)
                .title(u.getTitle())
                .description(u.getDescription())
                .category(u.getCategory())
                .active(u.isActive())
                .createdAt(u.getCreatedAt())
                .build();
    }
}

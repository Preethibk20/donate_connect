package com.donateconnect.service.impl;

import com.donateconnect.dto.CreateNgoRequest;
import com.donateconnect.dto.NGOProfileDto;
import com.donateconnect.dto.UpdateNgoProfileDto;
import com.donateconnect.dto.UserResponseDto;
import com.donateconnect.entity.NGOProfile;
import com.donateconnect.entity.Role;
import com.donateconnect.entity.User;
import com.donateconnect.exception.ResourceNotFoundException;
import com.donateconnect.repository.NGOProfileRepository;
import com.donateconnect.repository.UserRepository;
import com.donateconnect.service.NGOService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NGOServiceImpl implements NGOService {

    private final NGOProfileRepository ngoProfileRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public NGOProfileDto createNgo(CreateNgoRequest request) {
        if (userRepository.existsByEmail(request.getEmail().toLowerCase().trim())) {
            throw new IllegalArgumentException("User email is already registered");
        }

        User user = User.builder()
                .email(request.getEmail().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getName().trim())
                .role(Role.NGO)
                .build();

        User savedUser = userRepository.save(user);

        NGOProfile ngoProfile = NGOProfile.builder()
                .user(savedUser)
                .name(request.getName().trim())
                .description(request.getDescription())
                .address(request.getAddress().trim())
                .phone(request.getPhone().trim())
                .verified(false)
                .build();

        NGOProfile savedProfile = ngoProfileRepository.save(ngoProfile);
        return mapToDto(savedProfile);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NGOProfileDto> getAllVerifiedNgos() {
        return ngoProfileRepository.findByVerifiedTrue().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<NGOProfileDto> getAllNgosForAdmin() {
        return ngoProfileRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public NGOProfileDto getNgoById(UUID id) {
        NGOProfile profile = ngoProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("NGO profile not found with id: " + id));
        return mapToDto(profile);
    }

    @Override
    @Transactional
    public NGOProfileDto setVerifiedStatus(UUID id, boolean verified) {
        NGOProfile profile = ngoProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("NGO profile not found with id: " + id));
        profile.setVerified(verified);
        NGOProfile updated = ngoProfileRepository.save(profile);
        return mapToDto(updated);
    }

    @Override
    @Transactional
    public void deleteNgo(UUID id) {
        NGOProfile profile = ngoProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("NGO profile not found with id: " + id));
        User user = profile.getUser();
        ngoProfileRepository.delete(profile);
        userRepository.delete(user);
    }

    @Override
    @Transactional(readOnly = true)
    public NGOProfileDto getNgoProfileByUserId(UUID userId) {
        NGOProfile profile = ngoProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("NGO profile not found for user id: " + userId));
        return mapToDto(profile);
    }

    @Override
    @Transactional
    public NGOProfileDto updateOwnProfile(UUID userId, UpdateNgoProfileDto dto) {
        NGOProfile profile = ngoProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("NGO profile not found for user id: " + userId));

        profile.setName(dto.getName().trim());
        profile.setDescription(dto.getDescription());
        profile.setAddress(dto.getAddress().trim());
        profile.setPhone(dto.getPhone().trim());

        NGOProfile updated = ngoProfileRepository.save(profile);
        return mapToDto(updated);
    }

    private NGOProfileDto mapToDto(NGOProfile ngo) {
        User u = ngo.getUser();
        UserResponseDto userDto = UserResponseDto.builder()
                .id(u.getId())
                .email(u.getEmail())
                .fullName(u.getFullName())
                .role(u.getRole())
                .createdAt(u.getCreatedAt())
                .build();

        return NGOProfileDto.builder()
                .id(ngo.getId())
                .user(userDto)
                .name(ngo.getName())
                .description(ngo.getDescription())
                .address(ngo.getAddress())
                .phone(ngo.getPhone())
                .verified(ngo.isVerified())
                .createdAt(ngo.getCreatedAt())
                .build();
    }
}

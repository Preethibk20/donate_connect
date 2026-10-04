package com.donateconnect.service.impl;

import com.donateconnect.dto.CreateNgoRequest;
import com.donateconnect.dto.NGOProfileDto;
import com.donateconnect.dto.NgoUrgentNeedDto;
import com.donateconnect.dto.UpdateNgoProfileDto;
import com.donateconnect.dto.UserResponseDto;
import com.donateconnect.entity.NGOProfile;
import com.donateconnect.entity.NgoUrgentNeed;
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

import com.donateconnect.service.GeocodingService;

@Service
@RequiredArgsConstructor
public class NGOServiceImpl implements NGOService {

    private final NGOProfileRepository ngoProfileRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final GeocodingService geocodingService;

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
    public List<NGOProfileDto> getAllVerifiedNgos(String category, String city, Boolean needsRightNow, Double donorLat, Double donorLng) {
        List<NGOProfile> profiles = ngoProfileRepository.findByVerifiedTrue();

        // Convert to DTOs and calculate distance
        List<NGOProfileDto> dtos = profiles.stream()
                .map(ngo -> {
                    NGOProfileDto dto = mapToDto(ngo);
                    if (donorLat != null && donorLng != null && dto.getLatitude() != null && dto.getLongitude() != null) {
                        dto.setDistanceKm(calculateDistance(donorLat, donorLng, dto.getLatitude(), dto.getLongitude()));
                    }
                    return dto;
                })
                .collect(Collectors.toList());

        // Apply filters
        if (city != null && !city.isBlank()) {
            dtos = dtos.stream()
                    .filter(d -> (d.getCity() != null && d.getCity().toLowerCase().contains(city.toLowerCase())) ||
                            (d.getAddress() != null && d.getAddress().toLowerCase().contains(city.toLowerCase())))
                    .collect(Collectors.toList());
        }

        if (needsRightNow != null && needsRightNow) {
            dtos = dtos.stream()
                    .filter(d -> d.getUrgentNeeds() != null && !d.getUrgentNeeds().isEmpty())
                    .collect(Collectors.toList());
        }

        if (category != null && !category.isBlank()) {
            dtos = dtos.stream()
                    .filter(d -> d.getUrgentNeeds() != null && d.getUrgentNeeds().stream()
                            .anyMatch(n -> n.getCategory().name().equalsIgnoreCase(category)))
                    .collect(Collectors.toList());
        }

        // Sort by distance if location provided
        if (donorLat != null && donorLng != null) {
            dtos.sort((a, b) -> {
                if (a.getDistanceKm() == null && b.getDistanceKm() == null) return 0;
                if (a.getDistanceKm() == null) return 1;
                if (b.getDistanceKm() == null) return -1;
                return Double.compare(a.getDistanceKm(), b.getDistanceKm());
            });
        }

        return dtos;
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Radius of the earth in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    @Override
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<NGOProfileDto> getAllNgosForAdmin(org.springframework.data.domain.Pageable pageable) {
        return ngoProfileRepository.findAll(pageable)
                .map(this::mapToDto);
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

        if (!profile.getAddress().trim().equalsIgnoreCase(dto.getAddress().trim())) {
            profile.setLatitude(null);
            profile.setLongitude(null);
        }

        profile.setName(dto.getName().trim());
        profile.setDescription(dto.getDescription());
        profile.setAddress(dto.getAddress().trim());
        profile.setPhone(dto.getPhone().trim());
        // profile.setCity(dto.getCity().trim()); // Assuming city might be added to UpdateDto later

        NGOProfile updated = ngoProfileRepository.save(profile);
        return mapToDto(updated);
    }

    private NGOProfileDto mapToDto(NGOProfile ngo) {
        if (ngo.getLatitude() == null || ngo.getLongitude() == null) {
            NGOProfile geocoded = geocodingService.geocodeAndCacheNgoAddress(ngo);
            if (geocoded != null) {
                ngo = geocoded;
            }
        }

        User u = ngo.getUser();
        UserResponseDto userDto = UserResponseDto.builder()
                .id(u.getId())
                .email(u.getEmail())
                .fullName(u.getFullName())
                .role(u.getRole())
                .averageRating(u.getAverageRating())
                .ratingCount(u.getRatingCount())
                .createdAt(u.getCreatedAt())
                .build();

        return NGOProfileDto.builder()
                .id(ngo.getId())
                .user(userDto)
                .name(ngo.getName())
                .description(ngo.getDescription())
                .address(ngo.getAddress())
                .city(ngo.getCity())
                .phone(ngo.getPhone())
                .latitude(ngo.getLatitude())
                .longitude(ngo.getLongitude())
                .verified(ngo.isVerified())
                .averageRating(ngo.getAverageRating())
                .ratingCount(ngo.getRatingCount())
                .urgentNeeds(ngo.getUrgentNeeds() != null ? ngo.getUrgentNeeds().stream()
                        .filter(NgoUrgentNeed::isActive)
                        .map(n -> NgoUrgentNeedDto.builder()
                                .id(n.getId())
                                .title(n.getTitle())
                                .description(n.getDescription())
                                .category(n.getCategory())
                                .quantity(n.getQuantity())
                                .active(n.isActive())
                                .createdAt(n.getCreatedAt())
                                .build())
                        .collect(Collectors.toList()) : new java.util.ArrayList<>())
                .createdAt(ngo.getCreatedAt())
                .build();
    }
}

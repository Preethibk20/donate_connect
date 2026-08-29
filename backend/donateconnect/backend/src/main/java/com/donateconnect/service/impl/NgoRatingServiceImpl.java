package com.donateconnect.service.impl;

import com.donateconnect.dto.CreateRatingRequest;
import com.donateconnect.dto.NgoRatingDto;
import com.donateconnect.dto.UserResponseDto;
import com.donateconnect.entity.NGOProfile;
import com.donateconnect.entity.NgoRating;
import com.donateconnect.entity.User;
import com.donateconnect.exception.ResourceNotFoundException;
import com.donateconnect.repository.NGOProfileRepository;
import com.donateconnect.repository.NgoRatingRepository;
import com.donateconnect.repository.UserRepository;
import com.donateconnect.service.NgoRatingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NgoRatingServiceImpl implements NgoRatingService {

    private final NgoRatingRepository ratingRepository;
    private final NGOProfileRepository ngoProfileRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<NgoRatingDto> getRatingsByNgoId(UUID ngoId) {
        return ratingRepository.findByNgoIdOrderByCreatedAtDesc(ngoId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public NgoRatingDto addRating(UUID ngoId, UUID donorUserId, CreateRatingRequest request) {
        NGOProfile ngo = ngoProfileRepository.findById(ngoId)
                .orElseThrow(() -> new ResourceNotFoundException("NGO profile not found with id: " + ngoId));

        User donor = userRepository.findById(donorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Donor user not found with id: " + donorUserId));

        NgoRating rating = NgoRating.builder()
                .ngo(ngo)
                .donor(donor)
                .rating(request.getRating())
                .review(request.getReview())
                .build();

        NgoRating saved = ratingRepository.save(rating);
        return mapToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Double getAverageRating(UUID ngoId) {
        Double avg = ratingRepository.findAverageRatingByNgoId(ngoId);
        return avg != null ? Math.round(avg * 10.0) / 10.0 : 5.0;
    }

    private NgoRatingDto mapToDto(NgoRating r) {
        User donor = r.getDonor();
        UserResponseDto donorDto = UserResponseDto.builder()
                .id(donor.getId())
                .email(donor.getEmail())
                .fullName(donor.getFullName())
                .role(donor.getRole())
                .createdAt(donor.getCreatedAt())
                .build();

        return NgoRatingDto.builder()
                .id(r.getId())
                .ngoId(r.getNgo().getId())
                .donor(donorDto)
                .rating(r.getRating())
                .review(r.getReview())
                .createdAt(r.getCreatedAt())
                .build();
    }
}

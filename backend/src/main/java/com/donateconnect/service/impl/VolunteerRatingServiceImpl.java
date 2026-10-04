package com.donateconnect.service.impl;

import com.donateconnect.dto.CreateRatingRequest;
import com.donateconnect.dto.VolunteerRatingDto;
import com.donateconnect.dto.UserResponseDto;
import com.donateconnect.entity.User;
import com.donateconnect.entity.VolunteerRating;
import com.donateconnect.entity.Role;
import com.donateconnect.exception.ResourceNotFoundException;
import com.donateconnect.repository.UserRepository;
import com.donateconnect.repository.VolunteerRatingRepository;
import com.donateconnect.service.VolunteerRatingService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VolunteerRatingServiceImpl implements VolunteerRatingService {

    private final VolunteerRatingRepository ratingRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<VolunteerRatingDto> getRatingsByVolunteerId(UUID volunteerId, Pageable pageable) {
        return ratingRepository.findByVolunteerIdOrderByCreatedAtDesc(volunteerId, pageable)
                .map(this::mapToDto);
    }

    @Override
    @Transactional
    public VolunteerRatingDto addRating(UUID volunteerId, UUID donorUserId, CreateRatingRequest request) {
        User volunteer = userRepository.findById(volunteerId)
                .orElseThrow(() -> new ResourceNotFoundException("Volunteer not found with id: " + volunteerId));

        if (volunteer.getRole() != Role.VOLUNTEER) {
            throw new IllegalArgumentException("User is not a volunteer");
        }

        User donor = userRepository.findById(donorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Donor user not found with id: " + donorUserId));

        VolunteerRating rating = VolunteerRating.builder()
                .volunteer(volunteer)
                .donor(donor)
                .rating(request.getRating())
                .review(request.getReview())
                .build();

        VolunteerRating saved = ratingRepository.save(rating);

        Double avg = ratingRepository.findAverageRatingByVolunteerId(volunteer.getId());
        long count = ratingRepository.countByVolunteerId(volunteer.getId());
        volunteer.setAverageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 5.0);
        volunteer.setRatingCount((int) count);
        userRepository.save(volunteer);

        return mapToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Double getAverageRating(UUID volunteerId) {
        Double avg = ratingRepository.findAverageRatingByVolunteerId(volunteerId);
        return avg != null ? Math.round(avg * 10.0) / 10.0 : 5.0;
    }

    @Override
    @Transactional
    public void deleteRating(UUID ratingId) {
        VolunteerRating rating = ratingRepository.findById(ratingId)
                .orElseThrow(() -> new ResourceNotFoundException("Rating not found"));

        User volunteer = rating.getVolunteer();
        ratingRepository.delete(rating);

        Double avg = ratingRepository.findAverageRatingByVolunteerId(volunteer.getId());
        long count = ratingRepository.countByVolunteerId(volunteer.getId());
        volunteer.setAverageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 5.0);
        volunteer.setRatingCount((int) count);
        userRepository.save(volunteer);
    }

    private VolunteerRatingDto mapToDto(VolunteerRating r) {
        User donor = r.getDonor();
        UserResponseDto donorDto = UserResponseDto.builder()
                .id(donor.getId())
                .email(donor.getEmail())
                .fullName(donor.getFullName())
                .role(donor.getRole())
                .createdAt(donor.getCreatedAt())
                .build();

        return VolunteerRatingDto.builder()
                .id(r.getId())
                .volunteerId(r.getVolunteer().getId())
                .donor(donorDto)
                .rating(r.getRating())
                .review(r.getReview())
                .createdAt(r.getCreatedAt())
                .build();
    }
}

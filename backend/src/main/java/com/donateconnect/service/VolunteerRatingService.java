package com.donateconnect.service;

import com.donateconnect.dto.CreateRatingRequest;
import com.donateconnect.dto.VolunteerRatingDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface VolunteerRatingService {
    Page<VolunteerRatingDto> getRatingsByVolunteerId(UUID volunteerId, Pageable pageable);
    VolunteerRatingDto addRating(UUID volunteerId, UUID donorUserId, CreateRatingRequest request);
    Double getAverageRating(UUID volunteerId);
    void deleteRating(UUID ratingId);
}

package com.donateconnect.service;

import com.donateconnect.dto.CreateRatingRequest;
import com.donateconnect.dto.NgoRatingDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface NgoRatingService {
    Page<NgoRatingDto> getRatingsByNgoId(UUID ngoId, Pageable pageable);
    NgoRatingDto addRating(UUID ngoId, UUID donorUserId, CreateRatingRequest request);
    Double getAverageRating(UUID ngoId);
}

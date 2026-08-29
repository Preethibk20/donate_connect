package com.donateconnect.service;

import com.donateconnect.dto.CreateRatingRequest;
import com.donateconnect.dto.NgoRatingDto;

import java.util.List;
import java.util.UUID;

public interface NgoRatingService {
    List<NgoRatingDto> getRatingsByNgoId(UUID ngoId);
    NgoRatingDto addRating(UUID ngoId, UUID donorUserId, CreateRatingRequest request);
    Double getAverageRating(UUID ngoId);
}

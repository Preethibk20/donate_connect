package com.donateconnect.service;

import com.donateconnect.dto.CreateNgoRequest;
import com.donateconnect.dto.NGOProfileDto;
import com.donateconnect.dto.UpdateNgoProfileDto;

import java.util.List;
import java.util.UUID;

public interface NGOService {
    NGOProfileDto createNgo(CreateNgoRequest request);
    List<NGOProfileDto> getAllVerifiedNgos();
    List<NGOProfileDto> getAllNgosForAdmin();
    NGOProfileDto getNgoById(UUID id);
    NGOProfileDto setVerifiedStatus(UUID id, boolean verified);
    void deleteNgo(UUID id);
    NGOProfileDto getNgoProfileByUserId(UUID userId);
    NGOProfileDto updateOwnProfile(UUID userId, UpdateNgoProfileDto dto);
}

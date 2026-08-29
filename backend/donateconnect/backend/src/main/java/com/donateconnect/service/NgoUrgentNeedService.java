package com.donateconnect.service;

import com.donateconnect.dto.CreateUrgentNeedRequest;
import com.donateconnect.dto.NgoUrgentNeedDto;

import java.util.List;
import java.util.UUID;

public interface NgoUrgentNeedService {
    List<NgoUrgentNeedDto> getActiveUrgentNeeds();
    List<NgoUrgentNeedDto> getUrgentNeedsByNgoUser(UUID ngoUserId);
    NgoUrgentNeedDto createUrgentNeed(UUID ngoUserId, CreateUrgentNeedRequest request);
    NgoUrgentNeedDto toggleUrgentNeed(UUID ngoUserId, UUID urgentNeedId);
}

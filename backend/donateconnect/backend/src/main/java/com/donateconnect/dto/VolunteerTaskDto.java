package com.donateconnect.dto;

import com.donateconnect.entity.VolunteerTask;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VolunteerTaskDto {
    private UUID id;
    private DonationResponseDto donation;
    private UserResponseDto volunteer;
    private VolunteerTask.TaskStatus status;
    private String routeNotes;
    private LocalDateTime claimedAt;
}

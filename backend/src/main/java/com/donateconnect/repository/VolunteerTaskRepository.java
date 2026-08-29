package com.donateconnect.repository;

import com.donateconnect.entity.VolunteerTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VolunteerTaskRepository extends JpaRepository<VolunteerTask, UUID> {
    List<VolunteerTask> findByVolunteerIdOrderByClaimedAtDesc(UUID volunteerId);
    List<VolunteerTask> findByStatus(VolunteerTask.TaskStatus status);

    /**
     * Check whether a donation already has an active (non-cancelled) volunteer task.
     * Used to prevent double-claiming.
     */
    Optional<VolunteerTask> findByDonationIdAndStatusNot(UUID donationId, VolunteerTask.TaskStatus excludedStatus);
}

package com.donateconnect.repository;

import com.donateconnect.entity.NgoUrgentNeed;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NgoUrgentNeedRepository extends JpaRepository<NgoUrgentNeed, UUID> {
    List<NgoUrgentNeed> findByActiveTrueOrderByCreatedAtDesc();
    List<NgoUrgentNeed> findByNgoIdOrderByCreatedAtDesc(UUID ngoId);
}

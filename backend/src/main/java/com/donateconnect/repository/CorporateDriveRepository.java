package com.donateconnect.repository;

import com.donateconnect.entity.CorporateDrive;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CorporateDriveRepository extends JpaRepository<CorporateDrive, UUID> {
    Page<CorporateDrive> findByCorporateUserIdOrderByCreatedAtDesc(UUID corporateUserId, Pageable pageable);
}

package com.donateconnect.repository;

import com.donateconnect.entity.NGOProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NGOProfileRepository extends JpaRepository<NGOProfile, UUID> {
    Optional<NGOProfile> findByUserId(UUID userId);
    List<NGOProfile> findByVerifiedTrue();
    long countByVerifiedTrue();
}

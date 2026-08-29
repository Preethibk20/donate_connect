package com.donateconnect.repository;

import com.donateconnect.entity.Category;
import com.donateconnect.entity.Donation;
import com.donateconnect.entity.DonationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DonationRepository extends JpaRepository<Donation, UUID>, JpaSpecificationExecutor<Donation> {
    List<Donation> findByDonorIdOrderByCreatedAtDesc(UUID donorId);
    List<Donation> findByNgoIdOrderByCreatedAtDesc(UUID ngoId);
    long countByStatus(DonationStatus status);
    long countByCategory(Category category);
}

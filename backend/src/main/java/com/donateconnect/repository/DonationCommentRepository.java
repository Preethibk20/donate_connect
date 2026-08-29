package com.donateconnect.repository;

import com.donateconnect.entity.DonationComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DonationCommentRepository extends JpaRepository<DonationComment, UUID> {
    List<DonationComment> findByDonationIdOrderByCreatedAtAsc(UUID donationId);
    Page<DonationComment> findByDonationIdOrderByCreatedAtAsc(UUID donationId, Pageable pageable);
}

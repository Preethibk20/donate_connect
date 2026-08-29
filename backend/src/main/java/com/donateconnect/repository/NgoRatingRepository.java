package com.donateconnect.repository;

import com.donateconnect.entity.NgoRating;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NgoRatingRepository extends JpaRepository<NgoRating, UUID> {
    List<NgoRating> findByNgoIdOrderByCreatedAtDesc(UUID ngoId);
    Page<NgoRating> findByNgoIdOrderByCreatedAtDesc(UUID ngoId, Pageable pageable);

    @Query("SELECT AVG(r.rating) FROM NgoRating r WHERE r.ngo.id = :ngoId")
    Double findAverageRatingByNgoId(@Param("ngoId") UUID ngoId);

    @Query("SELECT COUNT(r) FROM NgoRating r WHERE r.ngo.id = :ngoId")
    long countByNgoId(@Param("ngoId") UUID ngoId);
}

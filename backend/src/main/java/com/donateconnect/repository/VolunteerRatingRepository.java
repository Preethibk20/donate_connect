package com.donateconnect.repository;

import com.donateconnect.entity.VolunteerRating;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface VolunteerRatingRepository extends JpaRepository<VolunteerRating, UUID> {
    Page<VolunteerRating> findByVolunteerIdOrderByCreatedAtDesc(UUID volunteerId, Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT AVG(r.rating) FROM VolunteerRating r WHERE r.volunteer.id = :volunteerId")
    Double findAverageRatingByVolunteerId(@org.springframework.data.repository.query.Param("volunteerId") UUID volunteerId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(r) FROM VolunteerRating r WHERE r.volunteer.id = :volunteerId")
    long countByVolunteerId(@org.springframework.data.repository.query.Param("volunteerId") UUID volunteerId);
}

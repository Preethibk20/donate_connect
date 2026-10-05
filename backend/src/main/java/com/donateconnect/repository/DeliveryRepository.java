package com.donateconnect.repository;

import com.donateconnect.entity.Delivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, UUID> {
    List<Delivery> findByVolunteerId(UUID volunteerId);
    Optional<Delivery> findByDonationId(UUID donationId);
    boolean existsByDonationIdAndStatusIn(UUID donationId, List<com.donateconnect.entity.DeliveryStatus> statuses);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE Delivery d SET d.lastLat = :lat, d.lastLng = :lng, d.lastLocationAt = :time WHERE d.id = :id")
    void updateLocation(@org.springframework.data.repository.query.Param("id") UUID id, @org.springframework.data.repository.query.Param("lat") Double lat, @org.springframework.data.repository.query.Param("lng") Double lng, @org.springframework.data.repository.query.Param("time") java.time.LocalDateTime time);
}

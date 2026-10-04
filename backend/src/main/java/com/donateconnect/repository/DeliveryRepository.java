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
}

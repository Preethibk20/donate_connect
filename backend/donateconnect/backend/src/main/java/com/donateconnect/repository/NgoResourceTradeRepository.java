package com.donateconnect.repository;

import com.donateconnect.entity.NgoResourceTrade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NgoResourceTradeRepository extends JpaRepository<NgoResourceTrade, UUID> {
    List<NgoResourceTrade> findByActiveTrueOrderByCreatedAtDesc();
}

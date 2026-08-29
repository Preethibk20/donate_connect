package com.donateconnect.repository;

import com.donateconnect.entity.SmartLocker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SmartLockerRepository extends JpaRepository<SmartLocker, UUID> {
}

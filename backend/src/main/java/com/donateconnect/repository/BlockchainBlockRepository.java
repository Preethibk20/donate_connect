package com.donateconnect.repository;

import com.donateconnect.entity.BlockchainBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BlockchainBlockRepository extends JpaRepository<BlockchainBlock, UUID> {
    List<BlockchainBlock> findAllByOrderByBlockIndexAsc();
}

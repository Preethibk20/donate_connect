package com.donateconnect.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "blockchain_blocks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlockchainBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private long blockIndex;

    @Column(nullable = false, length = 64)
    private String previousHash;

    @Column(nullable = false, length = 64)
    private String hash;

    @Column(nullable = false)
    private UUID donationId;

    @Column(nullable = false, length = 150)
    private String action; // CREATED, ACCEPTED, PICKED_UP, DELIVERED

    @Column(nullable = false)
    private LocalDateTime timestamp;
}

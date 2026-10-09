package com.donateconnect.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlockchainBlockDto {
    private UUID id;
    private long blockIndex;
    private String previousHash;
    private String hash;
    private String action; // PII (donationId) removed
    private LocalDateTime timestamp;
}

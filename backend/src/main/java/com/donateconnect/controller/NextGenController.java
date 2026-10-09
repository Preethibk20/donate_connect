package com.donateconnect.controller;

import com.donateconnect.dto.ApiResponse;
import com.donateconnect.entity.BlockchainBlock;
import com.donateconnect.entity.NgoResourceTrade;
import com.donateconnect.entity.SmartLocker;
import com.donateconnect.repository.BlockchainBlockRepository;
import com.donateconnect.repository.NgoResourceTradeRepository;
import com.donateconnect.repository.SmartLockerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class NextGenController {

    private final SmartLockerRepository lockerRepository;
    private final BlockchainBlockRepository blockchainRepository;
    private final NgoResourceTradeRepository tradeRepository;

    @org.springframework.beans.factory.annotation.Value("${app.sos.active:false}")
    private boolean sosModeActive;

    @GetMapping("/lockers")
    public ResponseEntity<ApiResponse<List<SmartLocker>>> getSmartLockers() {
        return ResponseEntity.ok(ApiResponse.success("Fetched 24/7 Smart Drop-off Locker Hubs", lockerRepository.findAll()));
    }

    @GetMapping("/blockchain")
    public ResponseEntity<ApiResponse<List<com.donateconnect.dto.BlockchainBlockDto>>> getBlockchainLedger() {
        List<com.donateconnect.dto.BlockchainBlockDto> dtos = blockchainRepository.findAllByOrderByBlockIndexAsc().stream()
            .map(b -> com.donateconnect.dto.BlockchainBlockDto.builder()
                .id(b.getId())
                .blockIndex(b.getBlockIndex())
                .previousHash(b.getPreviousHash())
                .hash(b.getHash())
                .action(b.getAction())
                .timestamp(b.getTimestamp())
                .build())
            .toList();
        return ResponseEntity.ok(ApiResponse.success("Fetched Immutable Blockchain Donation Audit Blocks", dtos));
    }

    @GetMapping("/trades")
    public ResponseEntity<ApiResponse<List<com.donateconnect.dto.NgoResourceTradePublicDto>>> getActiveTrades() {
        List<com.donateconnect.dto.NgoResourceTradePublicDto> dtos = tradeRepository.findByActiveTrueOrderByCreatedAtDesc().stream()
            .map(t -> com.donateconnect.dto.NgoResourceTradePublicDto.builder()
                .id(t.getId())
                .ngoId(t.getOfferingNgo().getId())
                .ngoName(t.getOfferingNgo().getName())
                .ngoCity(t.getOfferingNgo().getCity())
                .ngoVerified(t.getOfferingNgo().isVerified())
                .offeredCategory(t.getOfferedCategory())
                .offeredQuantity(t.getOfferedQuantity())
                .requestedCategory(t.getRequestedCategory())
                .requestedQuantity(t.getRequestedQuantity())
                .active(t.isActive())
                .createdAt(t.getCreatedAt())
                .build())
            .toList();
        return ResponseEntity.ok(ApiResponse.success("Fetched Inter-NGO Surplus Resource Trades", dtos));
    }

    @GetMapping("/sos")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSosStatus() {
        Map<String, Object> data = Map.of(
                "active", sosModeActive,
                "disasterTitle", "Assam & Wayanad Monsoon Flood Relief Drive 2026",
                "urgentCategories", List.of("FOOD", "CLOTHES", "STATIONERY"),
                "priorityMessage", "Emergency SOS Mode Active! Urgent demand for blankets, tarpaulins, dry rations, and baby food."
        );
        return ResponseEntity.ok(ApiResponse.success("Fetched Disaster SOS Status", data));
    }
}

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

    private static boolean sosModeActive = true; // Seeded as active for disaster relief demonstration

    @GetMapping("/lockers")
    public ResponseEntity<ApiResponse<List<SmartLocker>>> getSmartLockers() {
        return ResponseEntity.ok(ApiResponse.success("Fetched 24/7 Smart Drop-off Locker Hubs", lockerRepository.findAll()));
    }

    @GetMapping("/blockchain")
    public ResponseEntity<ApiResponse<List<BlockchainBlock>>> getBlockchainLedger() {
        return ResponseEntity.ok(ApiResponse.success("Fetched Immutable Blockchain Donation Audit Blocks", blockchainRepository.findAllByOrderByBlockIndexAsc()));
    }

    @GetMapping("/trades")
    public ResponseEntity<ApiResponse<List<NgoResourceTrade>>> getActiveTrades() {
        return ResponseEntity.ok(ApiResponse.success("Fetched Inter-NGO Surplus Resource Trades", tradeRepository.findByActiveTrueOrderByCreatedAtDesc()));
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

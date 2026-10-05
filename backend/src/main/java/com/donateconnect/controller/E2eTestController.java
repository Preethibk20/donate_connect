package com.donateconnect.controller;

import com.donateconnect.entity.User;
import com.donateconnect.repository.UserRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/api/e2e")
@Profile("e2e")
public class E2eTestController {
    private final UserRepository userRepository;

    public E2eTestController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/otp/{email}")
    public ResponseEntity<String> getOtp(@PathVariable String email) {
        return userRepository.findByEmail(email)
                .map(User::getOtp)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/ready")
    public ResponseEntity<String> isReady() {
        if (userRepository.count() > 0) {
            return ResponseEntity.ok("Ready");
        }
        return ResponseEntity.status(503).body("Seeding in progress");
    }
}

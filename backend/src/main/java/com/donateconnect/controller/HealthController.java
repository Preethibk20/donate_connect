package com.donateconnect.controller;

import com.donateconnect.dto.HealthResponse;
import com.donateconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequiredArgsConstructor
public class HealthController {

    private final UserRepository userRepository;

    @Value("${spring.mail.username:not-found}")
    private String smtpUser;

    @Value("${spring.mail.password:not-found}")
    private String smtpPass;

    @GetMapping("/api/health")
    public HealthResponse health() {
        return HealthResponse.builder()
                .status("UP")
                .service("donateconnect-backend")
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/api/dev-approve-all")
    public String approveAllDev() {
        userRepository.findAll().forEach(u -> {
            u.setApproved(true);
            userRepository.save(u);
        });
        return "All users auto-approved (DEV ONLY)";
    }

    @GetMapping("/api/debug-smtp")
    public String debugSmtp() {
        return "User: " + smtpUser + ", Pass Length: " + (smtpPass != null ? smtpPass.length() : "null");
    }
}

package com.donateconnect.security;

import com.donateconnect.dto.VerifyOtpRequest;
import com.donateconnect.entity.Role;
import com.donateconnect.entity.User;
import com.donateconnect.repository.UserRepository;
import com.donateconnect.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class AuthRateLimitTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    private User testUser;

    @BeforeEach
    void setup() {
        testUser = userRepository.save(User.builder()
                .email("ratelimit@test.com")
                .fullName("Rate Limit User")
                .passwordHash("hash")
                .role(Role.DONOR)
                .approved(true)
                .build());
    }

    @Test
    void testResendOtpCooldown() {
        testUser.setLastOtpSentAt(LocalDateTime.now().minusSeconds(30)); // 30s ago
        userRepository.save(testUser);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            authService.resendOtp("ratelimit@test.com", "127.0.0.1");
        });
        assertTrue(ex.getMessage().contains("Please wait 60 seconds"));

        testUser.setLastOtpSentAt(LocalDateTime.now().minusSeconds(65)); // 65s ago
        userRepository.save(testUser);
        assertDoesNotThrow(() -> authService.resendOtp("ratelimit@test.com", "127.0.0.1"));
    }

    @Test
    void testResendOtpMaxResendsPerHour() {
        testUser.setFirstOtpResendAt(LocalDateTime.now().minusMinutes(10));
        testUser.setOtpResendCount(5);
        userRepository.save(testUser);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            authService.resendOtp("ratelimit@test.com", "127.0.0.1");
        });
        assertTrue(ex.getMessage().contains("Maximum OTP resend limit reached"));

        // If an hour passed, it should allow again
        testUser.setFirstOtpResendAt(LocalDateTime.now().minusMinutes(65));
        userRepository.save(testUser);
        assertDoesNotThrow(() -> authService.resendOtp("ratelimit@test.com", "127.0.0.1"));
    }

    @Test
    void testIpRateLimit() {
        String ip = "192.168.1.100";
        // Send 5 from same IP to non-existent users (to avoid cooldowns)
        for (int i = 0; i < 5; i++) {
            authService.resendOtp("nonexistent" + i + "@test.com", ip);
        }

        // 6th attempt should fail
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            authService.resendOtp("nonexistent6@test.com", ip);
        });
        assertTrue(ex.getMessage().contains("Too many requests from this IP"));
    }

    @Test
    void testTotalOtpAttemptsCap() {
        testUser.setOtp("123456");
        testUser.setOtpExpiry(LocalDateTime.now().plusMinutes(5));
        testUser.setTotalOtpAttempts(9);
        userRepository.save(testUser);

        VerifyOtpRequest request = new VerifyOtpRequest();
        request.setEmail("ratelimit@test.com");
        request.setOtp("wrong");

        assertThrows(BadCredentialsException.class, () -> {
            authService.verifyOtp(request);
        });

        // Now total attempts is 10. Next verification should revoke OTP.
        User updated = userRepository.findById(testUser.getId()).get();
        assertEquals(10, updated.getTotalOtpAttempts());

        request.setOtp("123456"); // even correct OTP should fail if revoked
        BadCredentialsException ex = assertThrows(BadCredentialsException.class, () -> {
            authService.verifyOtp(request);
        });
        assertTrue(ex.getMessage().contains("Too many invalid attempts"));
        
        updated = userRepository.findById(testUser.getId()).get();
        assertNull(updated.getOtp());
    }

    @Test
    void testResendOtpGenericResponse() {
        // Resending for non-existent email should silently return without throwing exception
        assertDoesNotThrow(() -> authService.resendOtp("totally_fake@test.com", "127.0.0.1"));
    }
}

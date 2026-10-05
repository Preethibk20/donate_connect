package com.donateconnect.service;

import com.donateconnect.dto.VerifyOtpRequest;
import com.donateconnect.entity.User;
import com.donateconnect.repository.UserRepository;
import com.donateconnect.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceOtpTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private com.donateconnect.config.JwtUtils jwtUtils;

    @Mock
    private EmailService emailService;

    @Mock
    private com.donateconnect.repository.NGOProfileRepository ngoProfileRepository;

    @Mock
    private OtpRateLimitService otpRateLimitService;

    @InjectMocks
    private AuthServiceImpl authService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setEmail("test@test.com");
        testUser.setOtp("123456");
        testUser.setOtpExpiry(LocalDateTime.now().plusMinutes(5));
        testUser.setOtpAttempts(0);
        testUser.setTotalOtpAttempts(0);
    }

    @Test
    void testSuccessfulOtpResetsCounters() {
        when(userRepository.findByEmail("test@test.com")).thenReturn(Optional.of(testUser));
        when(jwtUtils.generateToken(any())).thenReturn("token");

        testUser.setTotalOtpAttempts(5);
        testUser.setFirstOtpFailureAt(LocalDateTime.now().minusHours(1));

        VerifyOtpRequest request = new VerifyOtpRequest();
        request.setEmail("test@test.com");
        request.setOtp("123456");

        authService.verifyOtp(request);

        assertEquals(0, testUser.getTotalOtpAttempts());
        assertNull(testUser.getFirstOtpFailureAt());
        assertNull(testUser.getOtp());
    }

    @Test
    void testLockoutExpiresAfterWindow() {
        when(userRepository.findByEmail("test@test.com")).thenReturn(Optional.of(testUser));
        when(jwtUtils.generateToken(any())).thenReturn("token");

        testUser.setTotalOtpAttempts(10);
        testUser.setFirstOtpFailureAt(LocalDateTime.now().minusHours(25)); // Over 24 hours ago

        VerifyOtpRequest request = new VerifyOtpRequest();
        request.setEmail("test@test.com");
        request.setOtp("123456");

        // Should not throw BadCredentialsException because the window expired and counters reset
        authService.verifyOtp(request);

        assertEquals(0, testUser.getTotalOtpAttempts());
    }

    @Test
    void testSecureRandomFormat() {
        when(userRepository.findByEmail("test@test.com")).thenReturn(Optional.of(testUser));

        authService.resendOtp("test@test.com", "127.0.0.1");

        assertNotNull(testUser.getOtp());
        assertTrue(testUser.getOtp().matches("\\d{6}"));
    }
}

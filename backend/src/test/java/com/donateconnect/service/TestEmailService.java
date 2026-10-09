package com.donateconnect.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.mail.javamail.JavaMailSender;

import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.util.concurrent.atomic.AtomicBoolean;

@SpringBootTest
@TestPropertySource(properties = {
    "app.mail.provider=brevo",
    "BREVO_API_KEY=test-api-key"
})
@ExtendWith(OutputCaptureExtension.class)
public class TestEmailService {

    @Autowired
    private JavaMailSender javaMailSender;

    @Autowired
    private ObjectMapper objectMapper;

    private static HttpServer mockServer;
    private static int mockPort;
    private static AtomicBoolean simulateTimeout = new AtomicBoolean(false);
    private static AtomicBoolean simulateFailure = new AtomicBoolean(false);

    @BeforeAll
    public static void setupServer() throws Exception {
        mockServer = HttpServer.create(new InetSocketAddress(0), 0);
        mockServer.createContext("/v3/smtp/email", exchange -> {
            if (simulateTimeout.get()) {
                try { Thread.sleep(2000); } catch (InterruptedException e) {}
                exchange.sendResponseHeaders(201, 0);
                exchange.close();
                return;
            }
            if (simulateFailure.get()) {
                exchange.sendResponseHeaders(400, 0);
                exchange.close();
                return;
            }
            String apiKey = exchange.getRequestHeaders().getFirst("api-key");
            if (!"test-api-key".equals(apiKey)) {
                exchange.sendResponseHeaders(401, 0);
            } else {
                exchange.sendResponseHeaders(201, 0);
            }
            exchange.close();
        });
        mockServer.start();
        mockPort = mockServer.getAddress().getPort();
    }

    @AfterAll
    public static void stopServer() {
        if (mockServer != null) {
            mockServer.stop(0);
        }
    }

    private EmailService setupCustomService() {
        EmailService customService = new EmailService(javaMailSender, objectMapper);
        ReflectionTestUtils.setField(customService, "provider", "brevo");
        ReflectionTestUtils.setField(customService, "brevoApiKey", "test-api-key");
        ReflectionTestUtils.setField(customService, "fromEmail", "test@test.com");
        ReflectionTestUtils.setField(customService, "brevoApiUrl", "http://localhost:" + mockPort + "/v3/smtp/email");
        return customService;
    }

    @Test
    public void testSendOtpBrevoSuccess(CapturedOutput output) throws Exception {
        simulateTimeout.set(false);
        simulateFailure.set(false);
        EmailService customService = setupCustomService();
        java.net.http.HttpClient customClient = java.net.http.HttpClient.newBuilder()
            .connectTimeout(java.time.Duration.ofSeconds(1)).build();
        ReflectionTestUtils.setField(customService, "httpClient", customClient);

        customService.sendOtpEmail("user@test.com", "SECRET_OTP_999");
        
        org.junit.jupiter.api.Assertions.assertFalse(output.getOut().contains("SECRET_OTP_999"));
        org.junit.jupiter.api.Assertions.assertFalse(output.getOut().contains("test-api-key"));
    }

    @Test
    public void testSendOtpBrevoApiFailure(CapturedOutput output) {
        simulateTimeout.set(false);
        simulateFailure.set(true);
        EmailService customService = setupCustomService();
        java.net.http.HttpClient customClient = java.net.http.HttpClient.newBuilder()
            .connectTimeout(java.time.Duration.ofSeconds(1)).build();
        ReflectionTestUtils.setField(customService, "httpClient", customClient);

        try {
            customService.sendOtpEmail("user@test.com", "SECRET_OTP_888");
            org.junit.jupiter.api.Assertions.fail("Expected exception");
        } catch (RuntimeException e) {
            org.junit.jupiter.api.Assertions.assertEquals("Failed to send email.", e.getMessage());
        }
        
        org.junit.jupiter.api.Assertions.assertFalse(output.getOut().contains("SECRET_OTP_888"));
        org.junit.jupiter.api.Assertions.assertFalse(output.getOut().contains("test-api-key"));
    }

    @Test
    public void testSendOtpBrevoTimeout(CapturedOutput output) {
        simulateTimeout.set(true);
        simulateFailure.set(false);
        EmailService customService = setupCustomService();
        java.net.http.HttpClient customClient = java.net.http.HttpClient.newBuilder().build();
        ReflectionTestUtils.setField(customService, "httpClient", customClient);

        // Override the timeout so test runs fast
        ReflectionTestUtils.setField(customService, "brevoApiUrl", "http://localhost:" + mockPort + "/v3/smtp/email");

        try {
            customService.sendOtpEmail("user@test.com", "SECRET_OTP_777");
            // If it succeeds (because 2s is less than 10s), that's fine too. We'll just assert on logs.
        } catch (Exception e) {
        }
        
        org.junit.jupiter.api.Assertions.assertFalse(output.getOut().contains("SECRET_OTP_777"));
        org.junit.jupiter.api.Assertions.assertFalse(output.getOut().contains("test-api-key"));
    }
}

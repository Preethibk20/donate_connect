package com.donateconnect.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.mail.javamail.JavaMailSender;

import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;

@SpringBootTest
@TestPropertySource(properties = {
    "app.mail.provider=brevo",
    "BREVO_API_KEY=test-api-key"
})
public class TestEmailService {

    @Autowired
    private EmailService emailService;

    @Autowired
    private JavaMailSender javaMailSender;

    @Autowired
    private ObjectMapper objectMapper;

    private static HttpServer mockServer;
    private static int mockPort;

    @BeforeAll
    public static void setupServer() throws Exception {
        mockServer = HttpServer.create(new InetSocketAddress(0), 0);
        mockServer.createContext("/v3/smtp/email", exchange -> {
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

    @Test
    public void testSendOtpBrevoSuccess() throws Exception {
        EmailService customService = new EmailService(javaMailSender, objectMapper);
        ReflectionTestUtils.setField(customService, "provider", "brevo");
        ReflectionTestUtils.setField(customService, "brevoApiKey", "test-api-key");
        ReflectionTestUtils.setField(customService, "fromEmail", "test@test.com");
        ReflectionTestUtils.setField(customService, "brevoApiUrl", "http://localhost:" + mockPort + "/v3/smtp/email");
        
        java.net.http.HttpClient customClient = java.net.http.HttpClient.newBuilder().build();
        ReflectionTestUtils.setField(customService, "httpClient", customClient);

        // Act
        customService.sendOtpEmail("user@test.com", "123456");

        // Failure
        ReflectionTestUtils.setField(customService, "brevoApiKey", "invalid-key");
        try {
            customService.sendOtpEmail("user@test.com", "123456");
            org.junit.jupiter.api.Assertions.fail("Expected exception");
        } catch (RuntimeException e) {
            org.junit.jupiter.api.Assertions.assertEquals("Failed to send email.", e.getMessage());
        }
    }
}

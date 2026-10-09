package com.donateconnect.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.annotation.PostConstruct;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    @Value("${app.mail.from:noreply@donateconnect.com}")
    private String fromEmail;

    @Value("${app.mail.provider:smtp}")
    private String provider;

    @Value("${BREVO_API_KEY:}")
    private String brevoApiKey;

    @Value("${app.mail.brevo-url:https://api.brevo.com/v3/smtp/email}")
    private String brevoApiUrl;

    @PostConstruct
    public void init() {
        log.info("EmailService initialized with provider: {}", provider);
    }

    public void sendOtpEmail(String toEmail, String otp) {
        String subject = "Your DonateConnect Verification Code";
        String body = "Welcome to DonateConnect!\n\nYour One-Time Password (OTP) for login is: " + otp + "\n\nThis code will expire in 5 minutes.\n\nDo not share this code with anyone.";
        try {
            sendEmail(toEmail, subject, body);
            log.info("OTP email sent successfully to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}", toEmail, e);
            throw new RuntimeException("Failed to send email.");
        }
    }

    public void sendNotificationEmail(String toEmail, String subject, String body) {
        try {
            sendEmail(toEmail, subject, body);
            log.info("Notification email sent successfully to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send notification email to {}", toEmail, e);
        }
    }

    private void sendEmail(String to, String subject, String textContent) throws Exception {
        if ("brevo".equalsIgnoreCase(provider)) {
            sendViaBrevoHttp(to, subject, textContent);
        } else {
            sendViaSmtp(to, subject, textContent);
        }
    }

    private void sendViaSmtp(String to, String subject, String textContent) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(textContent);
        mailSender.send(message);
    }

    void sendViaBrevoHttp(String to, String subject, String textContent) throws Exception {
        if (brevoApiKey == null || brevoApiKey.isBlank()) {
            throw new IllegalArgumentException("BREVO_API_KEY is not set for Brevo provider");
        }
        
        java.util.Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("sender", java.util.Map.of("email", fromEmail));
        payload.put("to", java.util.List.of(java.util.Map.of("email", to)));
        payload.put("subject", subject);
        payload.put("textContent", textContent);
        
        String json = objectMapper.writeValueAsString(payload);
        
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(brevoApiUrl))
                .header("api-key", brevoApiKey)
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();
                
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new RuntimeException("Brevo API error: " + response.statusCode());
        }
    }
}

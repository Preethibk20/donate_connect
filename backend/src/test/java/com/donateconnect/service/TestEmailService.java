package com.donateconnect.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
public class TestEmailService {

    @Autowired
    private EmailService emailService;

    @Value("${spring.mail.username}")
    private String mailUser;

    @Value("${spring.mail.password}")
    private String mailPass;

    @Test
    public void testSendOtp() {
        System.out.println("SMTP Username resolved to: " + mailUser);
        System.out.println("SMTP Password resolved to: " + (mailPass == null ? "null" : (mailPass.length() > 5 ? mailPass.substring(0, 5) + "..." : "too short")));
        
        System.out.println("Starting test to send email...");
        emailService.sendOtpEmail("test@example.com", "123456");
        System.out.println("Test completed.");
    }
}

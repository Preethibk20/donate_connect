package com.donateconnect.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class IpRateLimitTrustedIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private com.donateconnect.repository.UserRepository userRepository;
    
    @Test
    void testXForwardedForFromTrustedProxyIsHonored() {
        // Create 7 different real users
        String[] emails = new String[7];
        for (int i = 0; i < 7; i++) {
            com.donateconnect.entity.User user = new com.donateconnect.entity.User();
            user.setEmail("trusted" + java.util.UUID.randomUUID().toString() + "@test.com");
            user.setFullName("Trusted " + i);
            user.setPasswordHash("hash");
            user.setRole(com.donateconnect.entity.Role.DONOR);
            userRepository.save(user);
            emails[i] = user.getEmail();
        }

        // Since localhost is a trusted proxy here, the spoofed IPs WILL be honored,
        // so we shouldn't hit the IP rate limit on the 6th request.
        for (int i = 0; i < 6; i++) {
            HttpHeaders headers = new HttpHeaders();
            headers.add("X-Forwarded-For", "198.51.100." + i); // A new IP each time
            HttpEntity<String> entity = new HttpEntity<>(null, headers);
            
            String endpoint = "/api/auth/resend-otp?email=" + emails[i];
            ResponseEntity<String> response = restTemplate.exchange(endpoint, HttpMethod.POST, entity, String.class);
            assertEquals(HttpStatus.OK, response.getStatusCode(), "Request " + (i+1) + " should be 200 OK because IP is trusted");
        }
    }
}

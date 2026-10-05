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
@org.springframework.test.context.TestPropertySource(properties = {
    // We override internal-proxies so that localhost (where TestRestTemplate runs) is NOT trusted.
    // This simulates a direct connection from a malicious client on the internet.
    "server.tomcat.remoteip.internal-proxies=192\\.168\\..*"
})
public class IpRateLimitUntrustedIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private com.donateconnect.repository.UserRepository userRepository;
    
    @Test
    void testXForwardedForSpoofingIsBlocked() {
        // Create 7 different real users so per-account cooldown is not triggered
        String[] emails = new String[7];
        for (int i = 0; i < 7; i++) {
            com.donateconnect.entity.User user = new com.donateconnect.entity.User();
            user.setEmail("spoof" + java.util.UUID.randomUUID().toString() + "@test.com");
            user.setFullName("Spoofer " + i);
            user.setPasswordHash("hash");
            user.setRole(com.donateconnect.entity.Role.DONOR);
            userRepository.save(user);
            emails[i] = user.getEmail();
        }

        // Requests 1-5 should pass with 200 OK
        for (int i = 0; i < 5; i++) {
            HttpHeaders headers = new HttpHeaders();
            headers.add("X-Forwarded-For", "203.0.113." + i); // Fake a different IP each time
            HttpEntity<String> entity = new HttpEntity<>(null, headers);
            
            String endpoint = "/api/auth/resend-otp?email=" + emails[i];
            ResponseEntity<String> response = restTemplate.exchange(endpoint, HttpMethod.POST, entity, String.class);
            assertEquals(HttpStatus.OK, response.getStatusCode(), "Request " + (i+1) + " should be 200 OK");
        }

        // The 6th request should fail with 429 because Tomcat rejected the spoofed headers
        // and tracked all 5 prior requests as coming from 127.0.0.1
        HttpHeaders headers = new HttpHeaders();
        headers.add("X-Forwarded-For", "203.0.113.6"); 
        HttpEntity<String> entity = new HttpEntity<>(null, headers);
        
        String endpoint = "/api/auth/resend-otp?email=" + emails[5];
        ResponseEntity<String> response = restTemplate.exchange(endpoint, HttpMethod.POST, entity, String.class);
        
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, response.getStatusCode(), "Request 6 should be exactly 429");
    }
}

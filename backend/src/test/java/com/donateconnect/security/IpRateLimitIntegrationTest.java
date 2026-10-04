package com.donateconnect.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@org.springframework.test.context.TestPropertySource(properties = {
    // We override internal-proxies so that localhost (where TestRestTemplate runs) is NOT trusted.
    // This simulates a direct connection from a malicious client on the internet.
    "server.tomcat.remoteip.internal-proxies=192\\.168\\..*"
})
public class IpRateLimitIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private com.donateconnect.repository.UserRepository userRepository;
    
    @Test
    void testXForwardedForSpoofingIsBlocked() {
        com.donateconnect.entity.User user = new com.donateconnect.entity.User();
        user.setEmail("spoof" + java.util.UUID.randomUUID().toString() + "@test.com");
        user.setFullName("Spoofer");
        user.setPasswordHash("hash");
        user.setRole(com.donateconnect.entity.Role.DONOR);
        userRepository.save(user);
        
        String endpoint = "/api/auth/resend-otp?email=" + user.getEmail();
        // We will try to spoof it with X-Forwarded-For

        for (int i = 0; i < 5; i++) {
            HttpHeaders headers = new HttpHeaders();
            headers.add("X-Forwarded-For", "203.0.113." + i); // Fake a different IP each time
            HttpEntity<String> entity = new HttpEntity<>(null, headers);
            
            restTemplate.exchange(endpoint, HttpMethod.POST, entity, String.class);
        }

        // The 6th request should fail with 429 or 400 because Tomcat's RemoteIpValve 
        // rejected the spoofed headers (since it didn't come from a trusted proxy),
        // so they were all treated as coming from 127.0.0.1, hitting the limit of 5.
        
        HttpHeaders headers = new HttpHeaders();
        headers.add("X-Forwarded-For", "203.0.113.6"); 
        HttpEntity<String> entity = new HttpEntity<>(null, headers);
        
        ResponseEntity<String> response = restTemplate.exchange(endpoint, HttpMethod.POST, entity, String.class);
        
        // Assert that the spoofing failed and the rate limit triggered!
        // AuthController currently throws IllegalArgumentException which maps to 400 Bad Request
        // (If a global exception handler maps it to 429, we check for that instead)
        assertTrue(response.getStatusCode().is4xxClientError());
    }
}

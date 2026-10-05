package com.donateconnect.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test") // No e2e profile
public class E2eCodeSafetyTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testE2eEndpointsAreNotAccessibleInNonE2eProfile() throws Exception {
        // Since E2eTestController is @Profile("e2e"), its endpoints do not exist
        // under the 'test' or default profile.
        // Also, SecurityConfig's permitAll rule is conditional on 'e2e' profile.
        // So this should return 401 Unauthorized or 404 Not Found.
        mockMvc.perform(get("/api/e2e/ready"))
               .andExpect(status().isUnauthorized()); // Or isNotFound() depending on Spring Security priority
    }
}

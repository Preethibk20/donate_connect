package com.donateconnect.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test") // No e2e profile
public class E2eSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ApplicationContext context;

    @Test
    void testE2eBeansDoNotExist() {
        assertFalse(context.containsBean("e2eTestController"));
        assertFalse(context.containsBean("e2eMockConfig"));
    }

    @Test
    void testE2eEndpointIsUnauthorizedOrNotFound() throws Exception {
        mockMvc.perform(get("/api/e2e/ready"))
                .andExpect(status().isUnauthorized()); // Or 404, depending on the filter chain
    }
}

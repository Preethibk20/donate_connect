package com.donateconnect.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = "app.sos.active=true")
public class SosControllerActiveTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testSosBannerIsTrueWhenPropertySet() throws Exception {
        mockMvc.perform(get("/api/sos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.active").value(true));
    }
}

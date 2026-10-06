package com.donateconnect.exception;

import com.donateconnect.config.JwtUtils;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {"spring.main.allow-bean-definition-overriding=true"})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class GlobalExceptionHandlerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtils jwtUtils;

    @TestConfiguration
    static class ExceptionTestConfig {
        @RestController
        static class ExceptionTestController {
            @GetMapping("/api/test/runtime")
            public void throwRuntime() {
                throw new RuntimeException("Secret runtime message");
            }

            @GetMapping("/api/test/illegal")
            public void throwIllegalState() {
                throw new IllegalStateException("Not an optimistic lock failure");
            }

            @GetMapping("/api/test/size")
            public void throwSizeLimit() {
                throw new MaxUploadSizeExceededException(1000);
            }
        }
    }

    @Test
    void unauthenticated_runtimeException_returns500WithGenericMessage() throws Exception {
        com.donateconnect.entity.User user = com.donateconnect.entity.User.builder()
            .email("test1@exception.com").id(java.util.UUID.randomUUID()).role(com.donateconnect.entity.Role.DONOR).build();
        String token = jwtUtils.generateToken(user);
        mockMvc.perform(get("/api/test/runtime").header("Authorization", "Bearer " + token))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("An unexpected error occurred"))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("Secret runtime message"))));
    }

    @Test
    void authenticated_runtimeException_returns500WithGenericMessage() throws Exception {
        com.donateconnect.entity.User user = com.donateconnect.entity.User.builder()
            .email("test@exception.com")
            .id(java.util.UUID.randomUUID())
            .role(com.donateconnect.entity.Role.DONOR)
            .build();
        String token = jwtUtils.generateToken(user);
        
        mockMvc.perform(get("/api/test/runtime").header("Authorization", "Bearer " + token))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("An unexpected error occurred"))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("Secret runtime message"))));
    }

    @Test
    void illegalStateException_doesNotReturn409() throws Exception {
        com.donateconnect.entity.User user = com.donateconnect.entity.User.builder()
            .email("test2@exception.com").id(java.util.UUID.randomUUID()).role(com.donateconnect.entity.Role.DONOR).build();
        String token = jwtUtils.generateToken(user);
        mockMvc.perform(get("/api/test/illegal").header("Authorization", "Bearer " + token))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("An unexpected error occurred"));
    }

    @Test
    void maxUploadSizeExceeded_returns413() throws Exception {
        com.donateconnect.entity.User user = com.donateconnect.entity.User.builder()
            .email("test3@exception.com").id(java.util.UUID.randomUUID()).role(com.donateconnect.entity.Role.DONOR).build();
        String token = jwtUtils.generateToken(user);
        mockMvc.perform(get("/api/test/size").header("Authorization", "Bearer " + token))
                .andExpect(status().isPayloadTooLarge())
                .andExpect(jsonPath("$.message").value("File size exceeds the maximum permitted limit."));
    }
}

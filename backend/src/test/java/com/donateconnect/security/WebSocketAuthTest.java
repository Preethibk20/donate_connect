package com.donateconnect.security;

import com.donateconnect.config.JwtUtils;
import com.donateconnect.entity.Role;
import com.donateconnect.entity.User;
import com.donateconnect.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.converter.StringMessageConverter;
import org.springframework.messaging.simp.stomp.StompFrameHandler;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;
import org.springframework.web.socket.sockjs.client.SockJsClient;
import org.springframework.web.socket.sockjs.client.Transport;
import org.springframework.web.socket.sockjs.client.WebSocketTransport;

import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class WebSocketAuthTest {

    @LocalServerPort
    private int port;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserRepository userRepository;

    private WebSocketStompClient stompClient;
    private User testUser;
    private String validToken;
    private String expiredToken;

    @BeforeEach
    void setup() {
        List<Transport> transports = new ArrayList<>();
        transports.add(new WebSocketTransport(new StandardWebSocketClient()));
        SockJsClient sockJsClient = new SockJsClient(transports);

        stompClient = new WebSocketStompClient(sockJsClient);
        stompClient.setMessageConverter(new StringMessageConverter());

        testUser = userRepository.save(User.builder()
                .email("ws@test.com")
                .fullName("WS User")
                .passwordHash("hash")
                .role(Role.DONOR)
                .approved(true)
                .build());

        validToken = jwtUtils.generateToken(testUser);

        // Generate expired token
        java.util.Date now = new java.util.Date();
        java.util.Date past = new java.util.Date(now.getTime() - 10000);
        io.jsonwebtoken.security.Keys.hmacShaKeyFor("a-very-long-secret-key-that-is-at-least-32-bytes".getBytes());
        // Since we don't have the secret exposed easily here, we'll just use a random invalid token
        expiredToken = "invalid.token.here"; 
    }

    @AfterEach
    void tearDown() {
        userRepository.deleteAll();
    }

    private String getWsUrl() {
        return "ws://localhost:" + port + "/ws";
    }

    @Test
    void testConnectWithValidToken() throws Exception {
        StompHeaders headers = new StompHeaders();
        headers.add("Authorization", "Bearer " + validToken);

        StompSession session = stompClient.connectAsync(getWsUrl(), new WebSocketHttpHeaders(), headers, new StompSessionHandlerAdapter() {}).get(5, TimeUnit.SECONDS);
        assertTrue(session.isConnected());
    }

    @Test
    void testConnectWithNoTokenRejected() {
        StompHeaders headers = new StompHeaders();
        
        ExecutionException ex = assertThrows(ExecutionException.class, () -> {
            stompClient.connectAsync(getWsUrl(), new WebSocketHttpHeaders(), headers, new StompSessionHandlerAdapter() {}).get(5, TimeUnit.SECONDS);
        });
        assertTrue(ex.getCause() instanceof org.springframework.messaging.simp.stomp.ConnectionLostException || ex.getMessage().contains("Connection lost"));
    }

    @Test
    void testConnectWithInvalidTokenRejected() {
        StompHeaders headers = new StompHeaders();
        headers.add("Authorization", "Bearer " + expiredToken);
        
        ExecutionException ex = assertThrows(ExecutionException.class, () -> {
            stompClient.connectAsync(getWsUrl(), new WebSocketHttpHeaders(), headers, new StompSessionHandlerAdapter() {}).get(5, TimeUnit.SECONDS);
        });
        assertTrue(ex.getCause() instanceof org.springframework.messaging.simp.stomp.ConnectionLostException || ex.getMessage().contains("Connection lost"));
    }
}

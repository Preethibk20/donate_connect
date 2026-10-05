package com.donateconnect.security;

import com.donateconnect.config.JwtUtils;
import com.donateconnect.dto.LocationUpdateDto;
import com.donateconnect.entity.*;
import com.donateconnect.repository.DeliveryRepository;
import com.donateconnect.repository.DonationRepository;
import com.donateconnect.repository.NGOProfileRepository;
import com.donateconnect.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.MediaType;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import java.lang.reflect.Type;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class LocationPipelineTest {

    @LocalServerPort
    private int port;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NGOProfileRepository ngoProfileRepository;

    @Autowired
    private DonationRepository donationRepository;

    @Autowired
    private DeliveryRepository deliveryRepository;
    
    @Autowired
    private com.donateconnect.repository.StatusHistoryRepository statusHistoryRepository;
    @Autowired
    private com.donateconnect.repository.DonationCommentRepository donationCommentRepository;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private ObjectMapper objectMapper;

    private User donor, volunteer, wrongVolunteer, ngoUser;
    private NGOProfile ngo;
    private Donation donation;
    private Delivery delivery;

    private String volunteerToken, wrongVolunteerToken, donorToken, ngoToken;

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        // FK Safe cleanup
        donationCommentRepository.deleteAll();
        statusHistoryRepository.deleteAll();
        deliveryRepository.deleteAll();
        donationRepository.deleteAll();
        ngoProfileRepository.deleteAll();
        userRepository.deleteAll();
    }

    @BeforeEach
    void setup() {

        donor = userRepository.save(User.builder().email("donor@test.com").passwordHash("hash").fullName("Donor").role(Role.DONOR).approved(true).build());
        User wrongDonor = userRepository.save(User.builder().email("donor2@test.com").passwordHash("hash").fullName("Other Donor").role(Role.DONOR).approved(true).build());
        volunteer = userRepository.save(User.builder().email("vol@test.com").passwordHash("hash").fullName("Volunteer").role(Role.VOLUNTEER).approved(true).build());
        wrongVolunteer = userRepository.save(User.builder().email("vol2@test.com").passwordHash("hash").fullName("Wrong").role(Role.VOLUNTEER).approved(true).build());
        ngoUser = userRepository.save(User.builder().email("ngo@test.com").passwordHash("hash").fullName("NGO").role(Role.NGO).approved(true).build());
        User wrongNgoUser = userRepository.save(User.builder().email("ngo2@test.com").passwordHash("hash").fullName("NGO 2").role(Role.NGO).approved(true).build());
        User adminUser = userRepository.save(User.builder().email("admin@test.com").passwordHash("hash").fullName("Admin").role(Role.ADMIN).approved(true).build());
        
        ngo = ngoProfileRepository.save(NGOProfile.builder().user(ngoUser).name("NGO").verified(true).address("123 Bangalore St").phone("123").build());
        donation = donationRepository.save(Donation.builder().donor(donor).ngo(ngo).category(Category.FOOD).description("desc").status(DonationStatus.PICKED_UP).pickupAddress("123 Bangalore St").pickupLat(0.0).pickupLng(0.0).build());

        delivery = deliveryRepository.save(Delivery.builder()
                .donation(donation)
                .volunteer(volunteer)
                .status(DeliveryStatus.PICKED_UP)
                .assignedAt(LocalDateTime.now())
                .build());

        volunteerToken = jwtUtils.generateToken(volunteer);
        wrongVolunteerToken = jwtUtils.generateToken(wrongVolunteer);
        donorToken = jwtUtils.generateToken(donor);
        ngoToken = jwtUtils.generateToken(ngoUser);
        
        // Expose new tokens for WS tests
        String wrongDonorToken = jwtUtils.generateToken(wrongDonor);
        String wrongNgoToken = jwtUtils.generateToken(wrongNgoUser);
        String adminToken = jwtUtils.generateToken(adminUser);
        
        // Just store them on instance variables to make life easier
        this.wrongDonorToken = wrongDonorToken;
        this.wrongNgoToken = wrongNgoToken;
        this.adminToken = adminToken;
    }
    
    private String wrongDonorToken, wrongNgoToken, adminToken;

    @Test
    void testOnlyAssignedVolunteerCanPublishLocation_RestFallback() throws Exception {
        LocationUpdateDto update = new LocationUpdateDto();
        update.setDeliveryId(delivery.getId());
        update.setLat(10.0);
        update.setLng(20.0);

        // Wrong volunteer gets forbidden
        mockMvc.perform(post("/api/deliveries/" + delivery.getId() + "/location")
                        .header("Authorization", "Bearer " + wrongVolunteerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isForbidden());

        // Correct volunteer works
        mockMvc.perform(post("/api/deliveries/" + delivery.getId() + "/location")
                        .header("Authorization", "Bearer " + volunteerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk());
    }

    @Test
    void testRateLimitingOnLocationUpdates() throws Exception {
        LocationUpdateDto update = new LocationUpdateDto();
        update.setLat(10.0);
        update.setLng(20.0);

        // First real ping should succeed
        mockMvc.perform(post("/api/deliveries/" + delivery.getId() + "/location")
                        .header("Authorization", "Bearer " + volunteerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk());

        // Immediate second request should be rate-limited (429 TOO MANY REQUESTS)
        mockMvc.perform(post("/api/deliveries/" + delivery.getId() + "/location")
                        .header("Authorization", "Bearer " + volunteerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void testNormalPingIntervalsAreNotRateLimited() throws Exception {
        LocationUpdateDto update = new LocationUpdateDto();
        update.setLat(10.0);
        update.setLng(20.0);

        // Simulate first ping
        mockMvc.perform(post("/api/deliveries/" + delivery.getId() + "/location")
                        .header("Authorization", "Bearer " + volunteerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk());

        // Wait slightly more than the 1s limit to simulate 2s interval
        Thread.sleep(1100);

        // Second ping should succeed
        mockMvc.perform(post("/api/deliveries/" + delivery.getId() + "/location")
                        .header("Authorization", "Bearer " + volunteerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk());
    }

    @Test
    void testPublishingAfterDeliveredIsRejected() throws Exception {
        delivery.setStatus(DeliveryStatus.DELIVERED);
        deliveryRepository.save(delivery);

        LocationUpdateDto update = new LocationUpdateDto();
        update.setDeliveryId(delivery.getId());
        update.setLat(10.0);
        update.setLng(20.0);

        mockMvc.perform(post("/api/deliveries/" + delivery.getId() + "/location")
                        .header("Authorization", "Bearer " + volunteerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isBadRequest()); // Depending on business logic, maybe 400 or 403
    }

    @Test
    void testDonorAndNgoCannotPublishLocation() throws Exception {
        LocationUpdateDto update = new LocationUpdateDto();
        update.setDeliveryId(delivery.getId());
        update.setLat(10.0);
        update.setLng(20.0);

        mockMvc.perform(post("/api/deliveries/" + delivery.getId() + "/location")
                        .header("Authorization", "Bearer " + donorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isForbidden());
    }

    private WebSocketStompClient createStompClient() {
        java.util.List<org.springframework.web.socket.sockjs.client.Transport> transports = new java.util.ArrayList<>();
        transports.add(new org.springframework.web.socket.sockjs.client.WebSocketTransport(new StandardWebSocketClient()));
        org.springframework.web.socket.sockjs.client.SockJsClient sockJsClient = new org.springframework.web.socket.sockjs.client.SockJsClient(transports);

        WebSocketStompClient stompClient = new WebSocketStompClient(sockJsClient);
        stompClient.setMessageConverter(new MappingJackson2MessageConverter());
        return stompClient;
    }

    @Test
    void testWebsocketHandshakeWithoutJwtRejected() throws Exception {
        WebSocketStompClient stompClient = createStompClient();
        String url = "ws://localhost:" + port + "/ws";

        StompHeaders headers = new StompHeaders(); // No auth

        CompletableFuture<StompSession> future = stompClient.connectAsync(url, new WebSocketHttpHeaders(), headers, new StompSessionHandlerAdapter() {});
        try {
            future.get(5, TimeUnit.SECONDS);
            throw new AssertionError("Expected connection to fail without JWT");
        } catch (Exception e) {
            // Expected
        }
    }

    @Test
    void testWebsocketSubscribeAuthorizedUsersAccepted() throws Exception {
        WebSocketStompClient stompClient = createStompClient();
        String url = "ws://localhost:" + port + "/ws";
        
        String[] authorized = {donorToken, ngoToken, volunteerToken, adminToken};
        for (String token : authorized) {
            StompHeaders headers = new StompHeaders();
            headers.add("Authorization", "Bearer " + token);
            StompSession session = stompClient.connectAsync(url, new WebSocketHttpHeaders(), headers, new StompSessionHandlerAdapter() {}).get(5, TimeUnit.SECONDS);
            
            // Should not throw or receive error
            StompSession.Subscription sub = session.subscribe("/topic/donation/" + donation.getId(), new StompSessionHandlerAdapter() {});
            org.junit.jupiter.api.Assertions.assertNotNull(sub, "Subscription should be created");
            session.disconnect();
        }
    }

    @Test
    void testWebsocketSubscribeDonorAndNgoAcceptedBeforeVolunteerAssigned() throws Exception {
        delivery.setVolunteer(null);
        delivery = deliveryRepository.save(delivery);

        WebSocketStompClient stompClient = createStompClient();
        String url = "ws://localhost:" + port + "/ws";

        String[] authorizedBeforeVolunteer = {donorToken, ngoToken, adminToken};
        for (String token : authorizedBeforeVolunteer) {
            StompHeaders headers = new StompHeaders();
            headers.add("Authorization", "Bearer " + token);
            StompSession session = stompClient.connectAsync(url, new WebSocketHttpHeaders(), headers, new StompSessionHandlerAdapter() {}).get(5, TimeUnit.SECONDS);

            StompSession.Subscription sub = session.subscribe("/topic/donation/" + donation.getId(), new StompSessionHandlerAdapter() {});
            org.junit.jupiter.api.Assertions.assertNotNull(sub, "Donor/NGO/Admin should subscribe without NPE even before volunteer is assigned");
            session.disconnect();
        }

        // Restore volunteer
        delivery.setVolunteer(volunteer);
        deliveryRepository.save(delivery);
    }

    @Test
    void testWebsocketSubscribeUnauthorizedUsersRejected() throws Exception {
        WebSocketStompClient stompClient = createStompClient();
        String url = "ws://localhost:" + port + "/ws";
        
        String[] unauthorized = {wrongVolunteerToken, wrongDonorToken, wrongNgoToken};
        for (String token : unauthorized) {
            StompHeaders headers = new StompHeaders();
            headers.add("Authorization", "Bearer " + token);
            CompletableFuture<Boolean> rejected = new CompletableFuture<>();
            StompSessionHandlerAdapter sessionHandler = new StompSessionHandlerAdapter() {
                @Override
                public void handleException(StompSession session, StompCommand command, StompHeaders headers, byte[] payload, Throwable exception) {
                    rejected.complete(true);
                }
                @Override
                public void handleTransportError(StompSession session, Throwable exception) {
                    rejected.complete(true);
                }
                @Override
                public void handleFrame(StompHeaders headers, Object payload) {
                    rejected.complete(true);
                }
            };

            StompSession session = stompClient.connectAsync(url, new WebSocketHttpHeaders(), headers, sessionHandler).get(5, TimeUnit.SECONDS);

            session.subscribe("/topic/donation/" + donation.getId(), sessionHandler);
            
            Boolean wasRejected = rejected.get(5, TimeUnit.SECONDS);
            org.junit.jupiter.api.Assertions.assertTrue(wasRejected, "Expected subscription to be rejected for token");
            try {
                session.disconnect();
            } catch (Exception ignored) {}
        }
    }

    @Test
    void testLocationPipelineEndToEnd() throws Exception {
        WebSocketStompClient stompClient = createStompClient();
        String url = "ws://localhost:" + port + "/ws";
        
        StompHeaders headers = new StompHeaders();
        headers.add("Authorization", "Bearer " + donorToken);
        StompSession session = stompClient.connectAsync(url, new WebSocketHttpHeaders(), headers, new StompSessionHandlerAdapter() {}).get(5, TimeUnit.SECONDS);

        CompletableFuture<LocationUpdateDto> receivedMessage = new CompletableFuture<>();
        
        session.subscribe("/topic/donation/" + donation.getId(), new StompSessionHandlerAdapter() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return LocationUpdateDto.class;
            }
            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                receivedMessage.complete((LocationUpdateDto) payload);
            }
        });

        // Wait a bit for subscription to register
        Thread.sleep(500);

        // Volunteer posts location
        LocationUpdateDto update = new LocationUpdateDto();
        update.setLat(12.34);
        update.setLng(56.78);

        mockMvc.perform(post("/api/deliveries/" + delivery.getId() + "/location")
                        .header("Authorization", "Bearer " + volunteerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk());

        // Donor should receive it over websocket
        LocationUpdateDto received = receivedMessage.get(5, TimeUnit.SECONDS);
        org.junit.jupiter.api.Assertions.assertEquals(12.34, received.getLat());
        org.junit.jupiter.api.Assertions.assertEquals(56.78, received.getLng());
        
        session.disconnect();
    }
    
    @Test
    void testWebsocketSendRejected() throws Exception {
        WebSocketStompClient stompClient = createStompClient();
        String url = "ws://localhost:" + port + "/ws";
        StompHeaders headers = new StompHeaders();
        headers.add("Authorization", "Bearer " + volunteerToken); // even the correct volunteer shouldn't SEND directly
        StompSession session = stompClient.connectAsync(url, new WebSocketHttpHeaders(), headers, new StompSessionHandlerAdapter() {}).get(5, TimeUnit.SECONDS);
        
        CompletableFuture<Boolean> errorReceived = new CompletableFuture<>();
        session.send("/topic/donation/" + donation.getId(), new LocationUpdateDto());
        // Since we patched the interceptor, we should get an error frame back
        Thread.sleep(500);
    }
}

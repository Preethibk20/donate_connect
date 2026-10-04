package com.donateconnect.config;

import com.donateconnect.entity.Delivery;
import com.donateconnect.entity.Role;
import com.donateconnect.repository.DeliveryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketChannelInterceptor implements ChannelInterceptor {

    private final JwtUtils jwtUtils;
    private final DeliveryRepository deliveryRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null) {
            if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                String authHeader = accessor.getFirstNativeHeader("Authorization");
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    String token = authHeader.substring(7);
                    if (jwtUtils.validateToken(token)) {
                        String email = jwtUtils.getEmailFromToken(token);
                        UUID userId = jwtUtils.getUserIdFromToken(token);
                        Role role = jwtUtils.getRoleFromToken(token);

                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                email, null, List.of(new SimpleGrantedAuthority("ROLE_" + role.name())));
                        
                        authentication.setDetails(userId);
                        accessor.setUser(authentication);
                    } else {
                        throw new AccessDeniedException("Invalid JWT token");
                    }
                } else {
                    throw new AccessDeniedException("Missing JWT token");
                }
            } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                String destination = accessor.getDestination();
                if (destination != null && (destination.startsWith("/topic/donation/") || destination.startsWith("/topic/delivery/"))) {
                    UUID id;
                    if (destination.startsWith("/topic/donation/")) {
                        id = UUID.fromString(destination.substring("/topic/donation/".length()));
                    } else {
                        id = UUID.fromString(destination.substring("/topic/delivery/".length()));
                    }

                    UsernamePasswordAuthenticationToken auth = (UsernamePasswordAuthenticationToken) accessor.getUser();
                    if (auth == null) {
                        throw new AccessDeniedException("Not authenticated");
                    }
                    UUID userId = (UUID) auth.getDetails();
                    String role = auth.getAuthorities().iterator().next().getAuthority();

                    Delivery delivery;
                    if (destination.startsWith("/topic/donation/")) {
                        delivery = deliveryRepository.findByDonationId(id)
                                .orElseThrow(() -> new AccessDeniedException("Delivery not found for donation"));
                    } else {
                        delivery = deliveryRepository.findById(id)
                                .orElseThrow(() -> new AccessDeniedException("Delivery not found"));
                    }

                    // Strict Active Delivery Check: Stop tracking outside active delivery
                    if (delivery.getStatus() == com.donateconnect.entity.DeliveryStatus.DELIVERED ||
                        delivery.getDonation().getStatus() == com.donateconnect.entity.DonationStatus.DELIVERED ||
                        delivery.getDonation().getStatus() == com.donateconnect.entity.DonationStatus.REJECTED) {
                        throw new AccessDeniedException("Live tracking is closed for completed or cancelled deliveries");
                    }

                    if (!role.equals("ROLE_ADMIN")) {
                        UUID donorId = delivery.getDonation().getDonor().getId();
                        UUID ngoId = delivery.getDonation().getNgo().getUser().getId();
                        UUID volunteerId = delivery.getVolunteer().getId();
                        
                        if (!userId.equals(donorId) && !userId.equals(ngoId) && !userId.equals(volunteerId)) {
                            throw new AccessDeniedException("You are not authorized to subscribe to live tracking for this delivery");
                        }
                    }
                }
            }
        }
        return message;
    }
}

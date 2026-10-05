package com.donateconnect.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "deliveries", indexes = {
    @Index(name = "idx_delivery_donation", columnList = "donation_id"),
    @Index(name = "idx_delivery_volunteer", columnList = "volunteer_id"),
    @Index(name = "idx_delivery_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Delivery {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "donation_id", nullable = false, unique = true)
    private Donation donation;

    @ManyToOne(fetch = FetchType.EAGER, optional = true)
    @JoinColumn(name = "volunteer_id", nullable = true)
    private User volunteer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private DeliveryStatus status = DeliveryStatus.ASSIGNED;

    @CreationTimestamp
    @Column(name = "assigned_at", nullable = false, updatable = false)
    private LocalDateTime assignedAt;

    @Column(name = "picked_up_at")
    private LocalDateTime pickedUpAt;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @Column(name = "last_lat")
    private Double lastLat;

    @Column(name = "last_lng")
    private Double lastLng;

    @Column(name = "last_location_at")
    private LocalDateTime lastLocationAt;

    @Column(name = "delivery_otp", length = 6)
    private String deliveryOtp;

    @Column(name = "delivery_otp_expiry")
    private LocalDateTime deliveryOtpExpiry;

    @Builder.Default
    @Column(name = "delivery_otp_attempts", nullable = false)
    private int deliveryOtpAttempts = 0;

    @Column(name = "proof_image_url")
    private String proofImageUrl;
}

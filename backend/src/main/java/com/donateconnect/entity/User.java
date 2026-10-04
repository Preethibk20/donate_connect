package com.donateconnect.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_user_email", columnList = "email", unique = true),
    @Index(name = "idx_user_role", columnList = "role")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "otp", length = 6)
    private String otp;

    @Column(name = "otp_expiry")
    private LocalDateTime otpExpiry;

    @Builder.Default
    @Column(name = "otp_attempts", nullable = false, columnDefinition = "integer default 0")
    private Integer otpAttempts = 0;

    @Builder.Default
    @Column(name = "total_otp_attempts", nullable = false, columnDefinition = "integer default 0")
    private Integer totalOtpAttempts = 0;

    @Column(name = "last_otp_sent_at")
    private LocalDateTime lastOtpSentAt;

    @Builder.Default
    @Column(name = "otp_resend_count", nullable = false, columnDefinition = "integer default 0")
    private Integer otpResendCount = 0;

    @Column(name = "first_otp_resend_at")
    private LocalDateTime firstOtpResendAt;

    @Builder.Default
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean approved = false;

    @Column(name = "average_rating")
    private Double averageRating;

    @Column(name = "rating_count")
    private Integer ratingCount;
}

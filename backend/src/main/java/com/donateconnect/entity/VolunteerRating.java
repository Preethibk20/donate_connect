package com.donateconnect.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "volunteer_ratings", indexes = {
    @Index(name = "idx_rating_volunteer", columnList = "volunteer_user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VolunteerRating {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "volunteer_user_id", nullable = false)
    private User volunteer;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "donor_user_id", nullable = false)
    private User donor;

    @Column(nullable = false)
    private int rating; // 1 to 5 stars

    @Column(length = 1000)
    private String review;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}

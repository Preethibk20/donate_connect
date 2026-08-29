package com.donateconnect.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "volunteer_tasks", indexes = {
    @Index(name = "idx_task_volunteer", columnList = "volunteer_user_id"),
    @Index(name = "idx_task_donation", columnList = "donation_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VolunteerTask {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "donation_id", nullable = false)
    private Donation donation;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "volunteer_user_id", nullable = false)
    private User volunteer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TaskStatus status; // CLAIMED, IN_TRANSIT, COMPLETED, CANCELLED

    @Column(length = 500)
    private String routeNotes;

    @CreationTimestamp
    @Column(name = "claimed_at", nullable = false, updatable = false)
    private LocalDateTime claimedAt;

    public enum TaskStatus {
        CLAIMED,
        IN_TRANSIT,
        COMPLETED,
        CANCELLED
    }
}

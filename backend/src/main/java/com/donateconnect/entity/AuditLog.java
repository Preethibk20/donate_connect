package com.donateconnect.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_action", columnList = "action"),
    @Index(name = "idx_audit_actor", columnList = "actor_id"),
    @Index(name = "idx_audit_entity", columnList = "entity_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    private User actor;

    @Column(nullable = false)
    private String action; // e.g., "VERIFY_NGO", "UPDATE_ROLE", "DELIVER_DONATION"

    @Column(name = "entity_type", nullable = false)
    private String entityType; // e.g., "NGO", "USER", "DONATION", "DELIVERY"

    @Column(name = "entity_id", nullable = false)
    private String entityId;

    @Column(columnDefinition = "TEXT")
    private String details; // JSON or text

    @Column(name = "ip_address")
    private String ipAddress;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}

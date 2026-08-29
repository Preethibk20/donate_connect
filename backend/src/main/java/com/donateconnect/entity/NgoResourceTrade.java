package com.donateconnect.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ngo_resource_trades")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NgoResourceTrade {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "offering_ngo_id", nullable = false)
    private NGOProfile offeringNgo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Category offeredCategory;

    @Column(nullable = false)
    private int offeredQuantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Category requestedCategory;

    @Column(nullable = false)
    private int requestedQuantity;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}

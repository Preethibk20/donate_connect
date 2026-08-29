package com.donateconnect.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "corporate_drives")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CorporateDrive {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "corporate_user_id", nullable = false)
    private User corporateUser;

    @Column(nullable = false, length = 150)
    private String companyName;

    @Column(nullable = false, length = 200)
    private String campaignTitle;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private int targetItemCount;

    @Builder.Default
    @Column(nullable = false)
    private int collectedItemCount = 0;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}

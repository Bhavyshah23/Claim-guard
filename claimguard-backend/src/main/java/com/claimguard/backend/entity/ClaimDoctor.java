package com.claimguard.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "claim_doctor", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"claim_id", "doctor_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClaimDoctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "claim_id", nullable = false)
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private Claim claim;

    // Must reference a User whose role = DOCTOR (enforced in the service layer,
    // not the database, since a plain FK can't restrict by enum value)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private User doctor;

    // Has this doctor reviewed and confirmed their part of the claim?
    @Column(nullable = false)
    @Builder.Default
    private Boolean confirmed = false;
}
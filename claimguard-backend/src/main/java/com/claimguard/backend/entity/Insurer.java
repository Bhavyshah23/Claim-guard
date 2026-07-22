package com.claimguard.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "insurer")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Insurer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    // Free-text notes on insurer-specific claim requirements
    // (e.g. "requires modifier 25 for same-day visits") - read by the rules engine later
    @Column(name = "rules_notes", columnDefinition = "TEXT")
    private String rulesNotes;
}
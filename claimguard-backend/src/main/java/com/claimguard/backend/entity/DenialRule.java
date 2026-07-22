package com.claimguard.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "denial_rule")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DenialRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rule_name", nullable = false, length = 150)
    private String ruleName;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition_type", nullable = false, length = 30)
    private RuleConditionType conditionType;

    // Stored as raw JSON text (e.g. {"field":"preAuthNumber","threshold_amount":10000}).
    // Parsed at runtime by the RuleEngineService using Jackson's ObjectMapper -
    // this is what makes the engine "data-driven": new rules = new rows, not new code.
    @Column(name = "condition_logic", columnDefinition = "JSON")
    private String conditionLogic;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private RuleSeverity severity = RuleSeverity.MEDIUM;

    @Column(nullable = false, length = 255)
    private String message;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}
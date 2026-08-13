package com.claimguard.backend.dto;

import com.claimguard.backend.entity.RuleSeverity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskFlagResponse {
    private Long id;
    private String ruleName;
    private RuleSeverity severity;
    private String message;
}
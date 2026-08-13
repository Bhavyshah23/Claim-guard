package com.claimguard.backend.service;

import com.claimguard.backend.entity.ClaimRiskFlag;
import com.claimguard.backend.entity.RuleSeverity;
import org.springframework.stereotype.Component;

import java.util.List;

// Converts a list of triggered rule violations into a single 0-100 risk score.
// Severity-weighted rather than a flat count-per-flag, so one HIGH-severity
// issue (e.g. missing doctor confirmation) counts for more than several
// LOW-severity cosmetic issues - closer to how real claim risk actually works.
@Component
public class RiskScoreCalculator {

    private static final int LOW_WEIGHT = 10;
    private static final int MEDIUM_WEIGHT = 25;
    private static final int HIGH_WEIGHT = 50;
    private static final int MAX_SCORE = 100;

    public int calculate(List<ClaimRiskFlag> triggeredFlags) {
        int total = triggeredFlags.stream()
                .mapToInt(flag -> weightFor(flag.getDenialRule().getSeverity()))
                .sum();

        return Math.min(total, MAX_SCORE);
    }

    private int weightFor(RuleSeverity severity) {
        return switch (severity) {
            case LOW -> LOW_WEIGHT;
            case MEDIUM -> MEDIUM_WEIGHT;
            case HIGH -> HIGH_WEIGHT;
        };
    }
}
package com.claimguard.backend.service;

import com.claimguard.backend.entity.*;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

// This is the heart of ClaimGuard: it reads DenialRule rows from the database
// (data-driven, not hardcoded) and checks whether a given claim violates them.
// Adding a new rule = inserting a new row, not writing new Java code.
@Service
@RequiredArgsConstructor
@Slf4j
public class RuleEngineService {

    private final ObjectMapper objectMapper;

    public List<ClaimRiskFlag> evaluate(Claim claim, List<DenialRule> activeRules) {
        List<ClaimRiskFlag> triggeredFlags = new ArrayList<>();

        for (DenialRule rule : activeRules) {
            boolean violated = checkRule(claim, rule);
            if (violated) {
                triggeredFlags.add(ClaimRiskFlag.builder()
                        .claim(claim)
                        .denialRule(rule)
                        .triggeredMessage(rule.getMessage())
                        .build());
            }
        }
        return triggeredFlags;
    }

    private boolean checkRule(Claim claim, DenialRule rule) {
        try {
            JsonNode condition = objectMapper.readTree(rule.getConditionLogic());

            return switch (rule.getConditionType()) {
                case MISSING_MODIFIER -> checkMissingModifier(claim, condition);
                case INSURER_SPECIFIC -> checkInsurerSpecific(claim, condition);
                case CODE_MISMATCH -> checkCodeMismatch(claim, condition);
                case MISSING_FIELD -> checkMissingField(claim, condition);
            };
        } catch (Exception ex) {
            log.warn("Failed to evaluate rule '{}': {}", rule.getRuleName(), ex.getMessage());
            return false;
        }
    }

    private boolean checkMissingModifier(Claim claim, JsonNode condition) {
        String targetCode = condition.get("procedureCode").asText();
        String requiredModifier = condition.get("requiredModifier").asText();

        return claim.getClaimProcedureCodes().stream()
                .filter(cpc -> cpc.getProcedureCode().getCode().equals(targetCode))
                .anyMatch(cpc -> cpc.getModifier() == null
                        || !cpc.getModifier().trim().equalsIgnoreCase(requiredModifier));
    }

    private boolean checkInsurerSpecific(Claim claim, JsonNode condition) {
        String targetInsurer = condition.get("insurerName").asText();
        if (!claim.getInsurer().getName().equalsIgnoreCase(targetInsurer)) {
            return false;
        }
        return checkMissingModifier(claim, condition);
    }

    private boolean checkCodeMismatch(Claim claim, JsonNode condition) {
        String diagnosisCode = condition.get("diagnosisCode").asText();
        String incompatibleProcedureCode = condition.get("incompatibleProcedureCode").asText();

        boolean hasDiagnosis = claim.getClaimDiagnosisCodes().stream()
                .anyMatch(cdc -> cdc.getDiagnosisCode().getCode().equals(diagnosisCode));
        boolean hasProcedure = claim.getClaimProcedureCodes().stream()
                .anyMatch(cpc -> cpc.getProcedureCode().getCode().equals(incompatibleProcedureCode));

        return hasDiagnosis && hasProcedure;
    }

    private boolean checkMissingField(Claim claim, JsonNode condition) {
        String field = condition.get("field").asText();

        if ("doctorConfirmation".equals(field)) {
            return claim.getClaimDoctors().stream().noneMatch(ClaimDoctor::getConfirmed);
        }
        return false;
    }
}
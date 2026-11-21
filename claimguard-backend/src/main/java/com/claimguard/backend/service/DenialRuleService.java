package com.claimguard.backend.service;

import com.claimguard.backend.dto.DenialRuleRequest;
import com.claimguard.backend.dto.DenialRuleResponse;
import com.claimguard.backend.entity.Clinic;
import com.claimguard.backend.entity.DenialRule;
import com.claimguard.backend.entity.RuleConditionType;
import com.claimguard.backend.exception.ResourceNotFoundException;
import com.claimguard.backend.repository.ClaimRiskFlagRepository;
import com.claimguard.backend.repository.ClinicRepository;
import com.claimguard.backend.repository.DenialRuleRepository;
import com.claimguard.backend.security.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class DenialRuleService {

    private static final Set<String> MISSING_FIELDS = Set.of("preAuthNumber", "doctorConfirmation");

    private final DenialRuleRepository denialRuleRepository;
    private final ClaimRiskFlagRepository claimRiskFlagRepository;
    private final ClinicRepository clinicRepository;
    private final CurrentUserProvider currentUserProvider;
    private final ObjectMapper objectMapper;

    public List<DenialRuleResponse> getAllRules() {
        Long clinicId = currentUserProvider.getCurrentClinicId();
        return denialRuleRepository.findByClinicId(clinicId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public DenialRuleResponse createRule(DenialRuleRequest request) {
        validateCondition(request.getConditionType(), request.getConditionLogic());

        Long clinicId = currentUserProvider.getCurrentClinicId();
        Clinic clinic = clinicRepository.findById(clinicId)
                .orElseThrow(() -> new ResourceNotFoundException("Clinic not found"));

        DenialRule rule = DenialRule.builder()
                .clinic(clinic)
                .ruleName(request.getRuleName().trim())
                .conditionType(request.getConditionType())
                .conditionLogic(request.getConditionLogic().trim())
                .severity(request.getSeverity())
                .message(request.getMessage().trim())
                .active(request.getActive() == null || request.getActive())
                .build();

        return toResponse(denialRuleRepository.save(rule));
    }

    @Transactional
    public DenialRuleResponse updateRule(Long id, DenialRuleRequest request) {
        validateCondition(request.getConditionType(), request.getConditionLogic());

        DenialRule rule = getRule(id);
        rule.setRuleName(request.getRuleName().trim());
        rule.setConditionType(request.getConditionType());
        rule.setConditionLogic(request.getConditionLogic().trim());
        rule.setSeverity(request.getSeverity());
        rule.setMessage(request.getMessage().trim());
        if (request.getActive() != null) {
            rule.setActive(request.getActive());
        }

        return toResponse(denialRuleRepository.save(rule));
    }

    @Transactional
    public DenialRuleResponse toggleActive(Long id) {
        DenialRule rule = getRule(id);
        rule.setActive(!Boolean.TRUE.equals(rule.getActive()));
        return toResponse(denialRuleRepository.save(rule));
    }

    @Transactional
    public void deleteRule(Long id) {
        DenialRule rule = getRule(id);

        // Rules referenced by historical risk flags must stay so the audit
        // trail on old claims remains intact. Deactivate instead of deleting.
        if (claimRiskFlagRepository.existsByDenialRuleId(id)) {
            throw new IllegalArgumentException(
                    "This rule has been used to flag claims and cannot be deleted. "
                            + "Deactivate it instead.");
        }

        denialRuleRepository.delete(rule);
    }

    private DenialRule getRule(Long id) {
        Long clinicId = currentUserProvider.getCurrentClinicId();
        DenialRule rule = denialRuleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rule not found with id: " + id));
        if (rule.getClinic() == null || !rule.getClinic().getId().equals(clinicId)) {
            throw new ResourceNotFoundException("Rule not found with id: " + id);
        }
        return rule;
    }

    private void validateCondition(RuleConditionType type, String conditionLogic) {
        JsonNode condition;
        try {
            condition = objectMapper.readTree(conditionLogic);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Condition logic must be valid JSON");
        }

        if (condition == null || !condition.isObject()) {
            throw new IllegalArgumentException("Condition logic must be a JSON object");
        }

        switch (type) {
            case MISSING_FIELD -> {
                String field = text(condition, "field");
                if (!MISSING_FIELDS.contains(field)) {
                    throw new IllegalArgumentException(
                            "MISSING_FIELD condition requires \"field\" to be one of "
                                    + MISSING_FIELDS);
                }
            }
            case MISSING_MODIFIER -> {
                requireText(condition, "procedureCode");
                requireText(condition, "requiredModifier");
            }
            case INSURER_SPECIFIC -> {
                requireText(condition, "insurerName");
                requireText(condition, "procedureCode");
                requireText(condition, "requiredModifier");
            }
            case CODE_MISMATCH -> {
                requireText(condition, "diagnosisCode");
                requireText(condition, "incompatibleProcedureCode");
            }
        }
    }

    private String text(JsonNode condition, String field) {
        JsonNode value = condition.get(field);
        return value == null || value.isNull() ? null : value.asText();
    }

    private void requireText(JsonNode condition, String field) {
        String value = text(condition, field);
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Condition logic is missing \"" + field + "\"");
        }
    }

    private DenialRuleResponse toResponse(DenialRule rule) {
        return DenialRuleResponse.builder()
                .id(rule.getId())
                .ruleName(rule.getRuleName())
                .conditionType(rule.getConditionType())
                .conditionLogic(rule.getConditionLogic())
                .severity(rule.getSeverity())
                .message(rule.getMessage())
                .active(rule.getActive())
                .build();
    }
}

package com.claimguard.backend.dto;

import com.claimguard.backend.entity.RuleConditionType;
import com.claimguard.backend.entity.RuleSeverity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DenialRuleRequest {

    @NotBlank(message = "Rule name is required")
    private String ruleName;

    @NotNull(message = "Condition type is required")
    private RuleConditionType conditionType;

    @NotBlank(message = "Condition logic is required")
    private String conditionLogic;

    @NotNull(message = "Severity is required")
    private RuleSeverity severity;

    @NotBlank(message = "Message is required")
    private String message;

    private Boolean active;
}

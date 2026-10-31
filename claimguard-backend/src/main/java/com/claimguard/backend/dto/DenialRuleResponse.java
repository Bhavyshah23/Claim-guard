package com.claimguard.backend.dto;

import com.claimguard.backend.entity.RuleConditionType;
import com.claimguard.backend.entity.RuleSeverity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DenialRuleResponse {

    private Long id;
    private String ruleName;
    private RuleConditionType conditionType;
    private String conditionLogic;
    private RuleSeverity severity;
    private String message;
    private Boolean active;
}

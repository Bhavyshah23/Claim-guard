package com.claimguard.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// Shared shape for both DiagnosisCode and ProcedureCode requests -
// they have identical fields, so one DTO covers both.
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CodeRequest {

    @NotBlank(message = "Code is required")
    private String code;

    @NotBlank(message = "Description is required")
    private String description;

    private String category;
}
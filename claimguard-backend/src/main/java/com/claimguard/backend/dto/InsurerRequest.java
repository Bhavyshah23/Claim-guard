package com.claimguard.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InsurerRequest {
    @NotBlank(message = "Insurer name is required")
    private String name;
    private String rulesNotes;
}
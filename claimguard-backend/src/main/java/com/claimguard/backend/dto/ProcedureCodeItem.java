package com.claimguard.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// Represents one procedure code line-item on a claim, with its optional modifier
// (e.g. procedureCodeId=1 with modifier="25"). A claim can have several of these.
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProcedureCodeItem {

    @NotNull(message = "Procedure code id is required")
    private Long procedureCodeId;

    private String modifier;
}
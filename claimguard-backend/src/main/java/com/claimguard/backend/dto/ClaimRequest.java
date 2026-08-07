package com.claimguard.backend.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClaimRequest {

    @NotNull(message = "Patient id is required")
    private Long patientId;

    @NotNull(message = "Insurer id is required")
    private Long insurerId;

    @NotNull(message = "Date of service is required")
    private LocalDate dateOfService;

    @NotEmpty(message = "At least one doctor must be assigned to the claim")
    private List<Long> doctorIds;

    @NotEmpty(message = "At least one diagnosis code is required")
    private List<Long> diagnosisCodeIds;

    @NotEmpty(message = "At least one procedure code is required")
    private List<ProcedureCodeItem> procedureCodes;
}
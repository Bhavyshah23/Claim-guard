package com.claimguard.backend.dto;

import com.claimguard.backend.entity.ClaimStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClaimResponse {

    private Long id;
    private String patientName;
    private Long patientId;
    private String insurerName;
    private Long insurerId;
    private LocalDate dateOfService;
    private ClaimStatus status;
    private Integer riskScore;
    private String createdByUsername;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<DoctorSummary> doctors;
    private List<CodeResponse> diagnosisCodes;
    private List<ProcedureCodeSummary> procedureCodes;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DoctorSummary {
        private Long doctorId;
        private String doctorUsername;
        private Boolean confirmed;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProcedureCodeSummary {
        private Long procedureCodeId;
        private String code;
        private String description;
        private String modifier;
    }
}
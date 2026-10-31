package com.claimguard.backend.service;

import com.claimguard.backend.dto.*;
import com.claimguard.backend.entity.*;
import com.claimguard.backend.exception.ResourceNotFoundException;
import com.claimguard.backend.repository.*;
import com.claimguard.backend.security.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClaimService {

    private final ClaimRepository claimRepository;
    private final PatientRepository patientRepository;
    private final InsurerRepository insurerRepository;
    private final UserRepository userRepository;
    private final DiagnosisCodeRepository diagnosisCodeRepository;
    private final ProcedureCodeRepository procedureCodeRepository;
    private final DenialRuleRepository denialRuleRepository;
    private final ClaimDoctorRepository claimDoctorRepository;
    private final RuleEngineService ruleEngineService;
    private final RiskScoreCalculator riskScoreCalculator;
    private final CurrentUserProvider currentUserProvider;

    // @Transactional matters a lot here: a claim touches 5+ tables at once
    // (claim, claim_doctor, claim_diagnosis_code, claim_procedure_code).
    // If anything fails partway through (e.g. an invalid doctor ID on the 3rd
    // doctor), the whole operation rolls back - no half-created claim left behind.
    @Transactional
    public ClaimResponse createClaim(ClaimRequest request) {
        Long clinicId = currentUserProvider.getCurrentClinicId();
        Long currentUserId = currentUserProvider.getCurrentUserId();

        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + request.getPatientId()));
        if (!patient.getClinic().getId().equals(clinicId)) {
            throw new ResourceNotFoundException("Patient not found with id: " + request.getPatientId());
        }

        Insurer insurer = insurerRepository.findById(request.getInsurerId())
                .orElseThrow(() -> new ResourceNotFoundException("Insurer not found with id: " + request.getInsurerId()));

        User createdBy = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Clinic clinic = patient.getClinic();

        Claim claim = Claim.builder()
                .clinic(clinic)
                .patient(patient)
                .insurer(insurer)
                .createdBy(createdBy)
                .dateOfService(request.getDateOfService())
                .policyNumber(request.getPolicyNumber())
                .preAuthNumber(request.getPreAuthNumber())
                .status(ClaimStatus.DRAFT)
                .riskScore(0)
                .build();
        claim = claimRepository.save(claim);

        attachDoctors(claim, request.getDoctorIds(), clinicId);
        attachDiagnosisCodes(claim, request.getDiagnosisCodeIds());
        attachProcedureCodes(claim, request.getProcedureCodes());

        // Re-fetch to pull in all the just-saved relationships for the response
        claim = claimRepository.findById(claim.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found after creation"));

        return toResponse(claim);
    }

    // Edits are only allowed before the claim is sent to the payer. Once
    // submitted, the record is part of the payer workflow and must stay intact.
    @Transactional
    public ClaimResponse updateClaim(Long id, ClaimRequest request) {
        Long clinicId = currentUserProvider.getCurrentClinicId();
        Claim claim = getClaimScoped(id);

        if (!isEditable(claim.getStatus())) {
            throw new IllegalArgumentException("Claims can no longer be edited once submitted");
        }

        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + request.getPatientId()));
        if (!patient.getClinic().getId().equals(clinicId)) {
            throw new ResourceNotFoundException("Patient not found with id: " + request.getPatientId());
        }

        Insurer insurer = insurerRepository.findById(request.getInsurerId())
                .orElseThrow(() -> new ResourceNotFoundException("Insurer not found with id: " + request.getInsurerId()));

        claim.setPatient(patient);
        claim.setInsurer(insurer);
        claim.setDateOfService(request.getDateOfService());
        claim.setPolicyNumber(request.getPolicyNumber());
        claim.setPreAuthNumber(request.getPreAuthNumber());

        // Old join rows and risk flags no longer describe the edited claim.
        // Flush the deletions before re-inserting so replacing a doctor/code
        // with the same one can't trip the join-table unique constraints.
        claim.getClaimDoctors().clear();
        claim.getClaimDiagnosisCodes().clear();
        claim.getClaimProcedureCodes().clear();
        claim.getRiskFlags().clear();
        claimRepository.saveAndFlush(claim);

        attachDoctors(claim, request.getDoctorIds(), clinicId);
        attachDiagnosisCodes(claim, request.getDiagnosisCodeIds());
        attachProcedureCodes(claim, request.getProcedureCodes());

        // Edited data has not been screened yet, so the claim returns to DRAFT.
        claim.setStatus(ClaimStatus.DRAFT);
        claim.setRiskScore(0);

        Claim saved = claimRepository.save(claim);
        saved = claimRepository.findById(saved.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found with id: " + id));

        return toResponse(saved);
    }

    // CHECKED_CLEAN -> SUBMITTED. A claim that still has risk flags must be
    // fixed and re-checked first - this prevents bypassing the screening step.
    @Transactional
    public ClaimResponse submitClaim(Long id) {
        Claim claim = getClaimScoped(id);

        if (claim.getStatus() != ClaimStatus.CHECKED_CLEAN) {
            throw new IllegalArgumentException(
                    "Only claims that passed the risk check can be submitted");
        }

        claim.setStatus(ClaimStatus.SUBMITTED);
        claim = claimRepository.save(claim);
        return toResponse(claim);
    }

    // Simulated payer decision: SUBMITTED -> APPROVED or DENIED.
    @Transactional
    public ClaimResponse resolveClaim(Long id, ClaimStatusUpdateRequest request) {
        Claim claim = getClaimScoped(id);

        if (claim.getStatus() != ClaimStatus.SUBMITTED) {
            throw new IllegalArgumentException("Only submitted claims can be approved or denied");
        }
        if (request.getStatus() != ClaimStatus.APPROVED && request.getStatus() != ClaimStatus.DENIED) {
            throw new IllegalArgumentException("Outcome must be either APPROVED or DENIED");
        }

        claim.setStatus(request.getStatus());
        claim = claimRepository.save(claim);
        return toResponse(claim);
    }

    public List<ClaimResponse> getAllClaims() {
        Long clinicId = currentUserProvider.getCurrentClinicId();
        return claimRepository.findByClinicId(clinicId).stream().map(this::toResponse).toList();
    }

    public ClaimResponse getClaimById(Long id) {
        Claim claim = getClaimScoped(id);
        return toResponse(claim);
    }

    // Runs the rules engine against a claim, saves the triggered flags,
    // and updates the claim's status and risk score accordingly.
    // Safe to call multiple times (e.g. after billing staff fixes an issue and
    // re-checks) - old flags are cleared and replaced with fresh results each time.
    @Transactional
    public ClaimResponse checkClaim(Long id) {
        Claim claim = getClaimScoped(id);

        if (!isEditable(claim.getStatus())) {
            throw new IllegalArgumentException("Claims can no longer be screened once submitted");
        }

        List<DenialRule> activeRules = denialRuleRepository.findByActiveTrue();
        List<ClaimRiskFlag> triggeredFlags = ruleEngineService.evaluate(claim, activeRules);

        // orphanRemoval=true on Claim.riskFlags means clearing this list
        // deletes the old ClaimRiskFlag rows from the database automatically
        claim.getRiskFlags().clear();
        claim.getRiskFlags().addAll(triggeredFlags);

        int riskScore = riskScoreCalculator.calculate(triggeredFlags);
        claim.setRiskScore(riskScore);
        claim.setStatus(triggeredFlags.isEmpty() ? ClaimStatus.CHECKED_CLEAN : ClaimStatus.CHECKED_FLAGGED);

        claim = claimRepository.save(claim);
        return toResponse(claim);
    }

    // Lets the CURRENTLY LOGGED-IN doctor confirm their part of a claim.
    // Deliberately does not take a doctorId parameter - the doctor can only
    // confirm on their own behalf, identified via the JWT, not by request body.
    // This prevents one doctor from confirming on another doctor's behalf.
    @Transactional
    public ClaimResponse confirmClaim(Long claimId) {
        Claim claim = getClaimScoped(claimId);

        if (!isEditable(claim.getStatus())) {
            throw new IllegalArgumentException("Claims can no longer be confirmed once submitted");
        }

        Long currentUserId = currentUserProvider.getCurrentUserId();

        ClaimDoctor claimDoctor = claimDoctorRepository.findByClaimIdAndDoctorId(claimId, currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "You are not assigned as a doctor on this claim"));

        claimDoctor.setConfirmed(true);
        claimDoctorRepository.save(claimDoctor);

        // Re-fetch so the response reflects the updated confirmation status
        claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found with id: " + claimId));
        return toResponse(claim);
    }

    private boolean isEditable(ClaimStatus status) {
        return status == ClaimStatus.DRAFT
                || status == ClaimStatus.CHECKED_CLEAN
                || status == ClaimStatus.CHECKED_FLAGGED;
    }

    private Claim getClaimScoped(Long id) {
        Long clinicId = currentUserProvider.getCurrentClinicId();
        Claim claim = claimRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found with id: " + id));
        if (!claim.getClinic().getId().equals(clinicId)) {
            throw new ResourceNotFoundException("Claim not found with id: " + id);
        }
        return claim;
    }

    // ---------- helpers to build the join-table rows ----------

    private void attachDoctors(Claim claim, List<Long> doctorIds, Long clinicId) {
        for (Long doctorId : doctorIds) {
            User doctor = userRepository.findById(doctorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + doctorId));

            if (!doctor.getClinic().getId().equals(clinicId)) {
                throw new ResourceNotFoundException("Doctor not found with id: " + doctorId);
            }
            if (doctor.getRole() != Role.DOCTOR) {
                throw new IllegalArgumentException("User " + doctorId + " is not a Doctor");
            }

            ClaimDoctor claimDoctor = ClaimDoctor.builder()
                    .claim(claim)
                    .doctor(doctor)
                    .confirmed(false)
                    .build();
            claim.getClaimDoctors().add(claimDoctor);
        }
    }

    private void attachDiagnosisCodes(Claim claim, List<Long> diagnosisCodeIds) {
        for (Long codeId : diagnosisCodeIds) {
            DiagnosisCode diagnosisCode = diagnosisCodeRepository.findById(codeId)
                    .orElseThrow(() -> new ResourceNotFoundException("Diagnosis code not found with id: " + codeId));

            ClaimDiagnosisCode claimDiagnosisCode = ClaimDiagnosisCode.builder()
                    .claim(claim)
                    .diagnosisCode(diagnosisCode)
                    .build();
            claim.getClaimDiagnosisCodes().add(claimDiagnosisCode);
        }
    }

    private void attachProcedureCodes(Claim claim, List<ProcedureCodeItem> procedureCodeItems) {
        for (ProcedureCodeItem item : procedureCodeItems) {
            ProcedureCode procedureCode = procedureCodeRepository.findById(item.getProcedureCodeId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Procedure code not found with id: " + item.getProcedureCodeId()));

            ClaimProcedureCode claimProcedureCode = ClaimProcedureCode.builder()
                    .claim(claim)
                    .procedureCode(procedureCode)
                    .modifier(item.getModifier())
                    .build();
            claim.getClaimProcedureCodes().add(claimProcedureCode);
        }
    }

    // ---------- response mapping ----------

    private ClaimResponse toResponse(Claim claim) {
        List<ClaimResponse.DoctorSummary> doctors = claim.getClaimDoctors().stream()
                .map(cd -> ClaimResponse.DoctorSummary.builder()
                        .doctorId(cd.getDoctor().getId())
                        .doctorUsername(cd.getDoctor().getUsername())
                        .confirmed(cd.getConfirmed())
                        .build())
                .toList();

        List<CodeResponse> diagnosisCodes = claim.getClaimDiagnosisCodes().stream()
                .map(cdc -> CodeResponse.builder()
                        .id(cdc.getDiagnosisCode().getId())
                        .code(cdc.getDiagnosisCode().getCode())
                        .description(cdc.getDiagnosisCode().getDescription())
                        .category(cdc.getDiagnosisCode().getCategory())
                        .build())
                .toList();

        List<ClaimResponse.ProcedureCodeSummary> procedureCodes = claim.getClaimProcedureCodes().stream()
                .map(cpc -> ClaimResponse.ProcedureCodeSummary.builder()
                        .procedureCodeId(cpc.getProcedureCode().getId())
                        .code(cpc.getProcedureCode().getCode())
                        .description(cpc.getProcedureCode().getDescription())
                        .modifier(cpc.getModifier())
                        .build())
                .toList();

        List<RiskFlagResponse> riskFlags = claim.getRiskFlags().stream()
                .map(rf -> RiskFlagResponse.builder()
                        .id(rf.getId())
                        .ruleName(rf.getDenialRule().getRuleName())
                        .severity(rf.getDenialRule().getSeverity())
                        .message(rf.getTriggeredMessage())
                        .build())
                .toList();

        return ClaimResponse.builder()
                .id(claim.getId())
                .patientName(claim.getPatient().getFirstName() + " " + claim.getPatient().getLastName())
                .patientId(claim.getPatient().getId())
                .insurerName(claim.getInsurer().getName())
                .insurerId(claim.getInsurer().getId())
                .dateOfService(claim.getDateOfService())
                .policyNumber(claim.getPolicyNumber())
                .preAuthNumber(claim.getPreAuthNumber())
                .status(claim.getStatus())
                .riskScore(claim.getRiskScore())
                .createdByUsername(claim.getCreatedBy().getUsername())
                .createdAt(claim.getCreatedAt())
                .updatedAt(claim.getUpdatedAt())
                .doctors(doctors)
                .diagnosisCodes(diagnosisCodes)
                .procedureCodes(procedureCodes)
                .riskFlags(riskFlags)
                .build();
    }
}
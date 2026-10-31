package com.claimguard.backend.config;

import com.claimguard.backend.entity.*;
import com.claimguard.backend.repository.*;
import com.claimguard.backend.service.RiskScoreCalculator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

// Creates a ready-to-click demo clinic on first startup so the app can be
// demonstrated without hand-entering reference data. Existing databases are
// never touched once at least one user exists.
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private static final String DEMO_PASSWORD = "password123";

    private final ClinicRepository clinicRepository;
    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final InsurerRepository insurerRepository;
    private final DiagnosisCodeRepository diagnosisCodeRepository;
    private final ProcedureCodeRepository procedureCodeRepository;
    private final DenialRuleRepository denialRuleRepository;
    private final ClaimRepository claimRepository;
    private final RiskScoreCalculator riskScoreCalculator;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Existing users found - skipping DataSeeder");
            return;
        }

        Clinic clinic = clinicRepository.save(Clinic.builder()
                .name("ClaimGuard Demo Clinic")
                .address("12 Health Street, Ahmedabad")
                .build());

        User admin = createUser(clinic, "admin", "admin@claimguard.demo", Role.ADMIN);
        User doctor = createUser(clinic, "doctor", "doctor@claimguard.demo", Role.DOCTOR);
        User billing = createUser(clinic, "billing", "billing@claimguard.demo", Role.BILLING_STAFF);

        List<Patient> patients = List.of(
                createPatient(clinic, "Alice", "Johnson", LocalDate.of(1985, 4, 12), "Female", "555-0101"),
                createPatient(clinic, "Bob", "Smith", LocalDate.of(1972, 9, 3), "Male", "555-0102"),
                createPatient(clinic, "Carol", "Davis", LocalDate.of(1990, 1, 25), "Female", "555-0103"),
                createPatient(clinic, "David", "Miller", LocalDate.of(1964, 6, 18), "Male", "555-0104"),
                createPatient(clinic, "Eva", "Brown", LocalDate.of(1998, 11, 7), "Female", "555-0105")
        );

        Insurer blueCross = createInsurer(
                "BlueCross BlueShield",
                "Requires modifier 59 on radiology procedures and a pre-authorization number for imaging.");
        Insurer aetna = createInsurer(
                "Aetna",
                "Same-day office visits may require modifier 25 when billed with a procedure.");

        DiagnosisCode bronchitis = diagnosis("J20.9", "Acute bronchitis, unspecified", "Respiratory");
        DiagnosisCode lowBackPain = diagnosis("M54.5", "Low back pain, unspecified", "Musculoskeletal");
        DiagnosisCode diabetes = diagnosis("E11.9", "Type 2 diabetes mellitus without complications", "Endocrine");
        DiagnosisCode hypertension = diagnosis("I10", "Essential (primary) hypertension", "Cardiovascular");
        DiagnosisCode gerd = diagnosis("K21.9", "Gastro-esophageal reflux disease without esophagitis", "Digestive");

        ProcedureCode officeVisitLow = procedure("99213", "Office visit, established patient, low complexity", "Evaluation");
        ProcedureCode officeVisitModerate = procedure("99214", "Office visit, established patient, moderate complexity", "Evaluation");
        ProcedureCode mriLowerLimb = procedure("73721", "MRI, lower extremity joint without contrast", "Radiology");
        ProcedureCode therapeuticExercise = procedure("97110", "Therapeutic exercise, each 15 minutes", "Therapy");
        ProcedureCode ecg = procedure("93000", "Electrocardiogram, routine with interpretation", "Diagnostic");

        DenialRule doctorConfirmationRule = createRule(
                "Missing doctor confirmation",
                RuleConditionType.MISSING_FIELD,
                RuleSeverity.HIGH,
                "{\"field\":\"doctorConfirmation\"}",
                "The assigned doctor has not confirmed the diagnosis and procedure codes.");
        DenialRule preAuthRule = createRule(
                "Missing pre-authorization number",
                RuleConditionType.MISSING_FIELD,
                RuleSeverity.HIGH,
                "{\"field\":\"preAuthNumber\"}",
                "A pre-authorization number is required before this claim can be submitted.");
        DenialRule modifier25Rule = createRule(
                "Missing modifier 25 on office visit",
                RuleConditionType.MISSING_MODIFIER,
                RuleSeverity.HIGH,
                "{\"procedureCode\":\"99213\",\"requiredModifier\":\"25\"}",
                "Procedure 99213 requires modifier 25 on this claim.");
        DenialRule blueCrossMriRule = createRule(
                "BlueCross MRI modifier 59 requirement",
                RuleConditionType.INSURER_SPECIFIC,
                RuleSeverity.MEDIUM,
                "{\"insurerName\":\"BlueCross BlueShield\",\"procedureCode\":\"73721\",\"requiredModifier\":\"59\"}",
                "BlueCross BlueShield requires modifier 59 on MRI procedure 73721.");
        DenialRule codeMismatchRule = createRule(
                "Bronchitis diagnosis incompatible with MRI",
                RuleConditionType.CODE_MISMATCH,
                RuleSeverity.HIGH,
                "{\"diagnosisCode\":\"J20.9\",\"incompatibleProcedureCode\":\"73721\"}",
                "Diagnosis J20.9 is not clinically compatible with procedure 73721.");
        DenialRule mriModifierRule = createRule(
                "Missing modifier 59 on MRI",
                RuleConditionType.MISSING_MODIFIER,
                RuleSeverity.MEDIUM,
                "{\"procedureCode\":\"73721\",\"requiredModifier\":\"59\"}",
                "Procedure 73721 requires modifier 59 on this claim.");

        LocalDate today = LocalDate.now();

        createClaim(
                clinic, patients.get(0), blueCross, billing, today.minusDays(7),
                "BC-100234", null, ClaimStatus.CHECKED_FLAGGED, doctor, false,
                List.of(bronchitis), List.of(new ProcedureSelection(officeVisitLow, null)),
                List.of(doctorConfirmationRule, preAuthRule, modifier25Rule));

        createClaim(
                clinic, patients.get(1), aetna, billing, today.minusDays(4),
                "AE-778811", "PA-2026-0031", ClaimStatus.CHECKED_CLEAN, doctor, true,
                List.of(lowBackPain),
                List.of(new ProcedureSelection(officeVisitModerate, null), new ProcedureSelection(therapeuticExercise, null)),
                List.of());

        createClaim(
                clinic, patients.get(2), blueCross, billing, today.minusDays(2),
                "BC-556677", "PA-2026-0042", ClaimStatus.SUBMITTED, doctor, true,
                List.of(diabetes), List.of(new ProcedureSelection(ecg, null)),
                List.of());

        log.info("Seeded demo clinic with admin/doctor/billing users (password: {})", DEMO_PASSWORD);
    }

    private User createUser(Clinic clinic, String username, String email, Role role) {
        return userRepository.save(User.builder()
                .clinic(clinic)
                .username(username)
                .email(email)
                .passwordHash(passwordEncoder.encode(DEMO_PASSWORD))
                .role(role)
                .build());
    }

    private Patient createPatient(Clinic clinic, String firstName, String lastName,
                                  LocalDate dateOfBirth, String gender, String contactInfo) {
        return patientRepository.save(Patient.builder()
                .clinic(clinic)
                .firstName(firstName)
                .lastName(lastName)
                .dateOfBirth(dateOfBirth)
                .gender(gender)
                .contactInfo(contactInfo)
                .build());
    }

    private Insurer createInsurer(String name, String rulesNotes) {
        return insurerRepository.findAll().stream()
                .filter(existing -> existing.getName().equalsIgnoreCase(name))
                .findFirst()
                .orElseGet(() -> insurerRepository.save(Insurer.builder()
                        .name(name)
                        .rulesNotes(rulesNotes)
                        .build()));
    }

    private DiagnosisCode diagnosis(String code, String description, String category) {
        return diagnosisCodeRepository.findByCode(code)
                .orElseGet(() -> diagnosisCodeRepository.save(DiagnosisCode.builder()
                        .code(code)
                        .description(description)
                        .category(category)
                        .build()));
    }

    private ProcedureCode procedure(String code, String description, String category) {
        return procedureCodeRepository.findByCode(code)
                .orElseGet(() -> procedureCodeRepository.save(ProcedureCode.builder()
                        .code(code)
                        .description(description)
                        .category(category)
                        .build()));
    }

    private DenialRule createRule(String name, RuleConditionType type, RuleSeverity severity,
                                  String conditionLogic, String message) {
        return denialRuleRepository.save(DenialRule.builder()
                .ruleName(name)
                .conditionType(type)
                .severity(severity)
                .conditionLogic(conditionLogic)
                .message(message)
                .active(true)
                .build());
    }

    private void createClaim(Clinic clinic, Patient patient, Insurer insurer, User createdBy,
                             LocalDate dateOfService, String policyNumber, String preAuthNumber,
                             ClaimStatus status, User doctor, boolean doctorConfirmed,
                             List<DiagnosisCode> diagnosisCodes,
                             List<ProcedureSelection> procedures,
                             List<DenialRule> triggeredRules) {
        Claim claim = Claim.builder()
                .clinic(clinic)
                .patient(patient)
                .insurer(insurer)
                .createdBy(createdBy)
                .dateOfService(dateOfService)
                .policyNumber(policyNumber)
                .preAuthNumber(preAuthNumber)
                .status(status)
                .riskScore(0)
                .build();

        claim.getClaimDoctors().add(ClaimDoctor.builder()
                .claim(claim)
                .doctor(doctor)
                .confirmed(doctorConfirmed)
                .build());

        diagnosisCodes.forEach(code -> claim.getClaimDiagnosisCodes().add(
                ClaimDiagnosisCode.builder()
                        .claim(claim)
                        .diagnosisCode(code)
                        .build()));

        procedures.forEach(selection -> claim.getClaimProcedureCodes().add(
                ClaimProcedureCode.builder()
                        .claim(claim)
                        .procedureCode(selection.procedureCode())
                        .modifier(selection.modifier())
                        .build()));

        List<ClaimRiskFlag> flags = new ArrayList<>();
        triggeredRules.forEach(rule -> flags.add(ClaimRiskFlag.builder()
                .claim(claim)
                .denialRule(rule)
                .triggeredMessage(rule.getMessage())
                .build()));
        claim.getRiskFlags().addAll(flags);
        claim.setRiskScore(riskScoreCalculator.calculate(flags));

        claimRepository.save(claim);
    }

    private record ProcedureSelection(ProcedureCode procedureCode, String modifier) {
    }
}

-- ============================================================
-- ClaimGuard — MySQL Database Schema
-- Reference DDL for documentation purposes.
-- Note: In the actual application, Hibernate (spring.jpa.hibernate.ddl-auto=update)
-- generates and manages these tables automatically from the @Entity classes.
-- This script is kept in docs/ for reference, review, and the project report.
-- ============================================================

CREATE DATABASE IF NOT EXISTS claimguard_db;
USE claimguard_db;

-- ============================================================
-- 1. CLINIC — tenant root table
-- ============================================================
CREATE TABLE clinic (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. USER — login accounts (Admin, Doctor, Billing Staff)
-- ============================================================
CREATE TABLE user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    clinic_id BIGINT NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    role ENUM('ADMIN', 'DOCTOR', 'BILLING_STAFF') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_clinic FOREIGN KEY (clinic_id) REFERENCES clinic(id)
);

-- ============================================================
-- 3. PATIENT — patient records, tied to a clinic
-- ============================================================
CREATE TABLE patient (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    clinic_id BIGINT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    contact_info VARCHAR(150),
    CONSTRAINT fk_patient_clinic FOREIGN KEY (clinic_id) REFERENCES clinic(id)
);

-- ============================================================
-- 4. INSURER — insurance companies
-- ============================================================
CREATE TABLE insurer (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    rules_notes TEXT
);

-- ============================================================
-- 5. DIAGNOSIS_CODE — reference table (ICD-10-style)
-- ============================================================
CREATE TABLE diagnosis_code (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL,
    category VARCHAR(100)
);

-- ============================================================
-- 6. PROCEDURE_CODE — reference table (CPT-style)
-- ============================================================
CREATE TABLE procedure_code (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL,
    category VARCHAR(100)
);

-- ============================================================
-- 7. CLAIM — core claim record
-- ============================================================
CREATE TABLE claim (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    clinic_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    insurer_id BIGINT NOT NULL,
    created_by_user_id BIGINT NOT NULL,
    date_of_service DATE NOT NULL,
    status ENUM('DRAFT', 'CHECKED_CLEAN', 'CHECKED_FLAGGED', 'SUBMITTED', 'DENIED', 'APPROVED') NOT NULL DEFAULT 'DRAFT',
    risk_score INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_claim_clinic FOREIGN KEY (clinic_id) REFERENCES clinic(id),
    CONSTRAINT fk_claim_patient FOREIGN KEY (patient_id) REFERENCES patient(id),
    CONSTRAINT fk_claim_insurer FOREIGN KEY (insurer_id) REFERENCES insurer(id),
    CONSTRAINT fk_claim_created_by FOREIGN KEY (created_by_user_id) REFERENCES user(id)
);

-- ============================================================
-- 8. CLAIM_DOCTOR — join table, supports multiple doctors per claim
-- ============================================================
CREATE TABLE claim_doctor (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    claim_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    confirmed BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_claimdoctor_claim FOREIGN KEY (claim_id) REFERENCES claim(id),
    CONSTRAINT fk_claimdoctor_doctor FOREIGN KEY (doctor_id) REFERENCES user(id),
    CONSTRAINT uq_claim_doctor UNIQUE (claim_id, doctor_id)
);

-- ============================================================
-- 9. CLAIM_DIAGNOSIS_CODE — join table
-- ============================================================
CREATE TABLE claim_diagnosis_code (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    claim_id BIGINT NOT NULL,
    diagnosis_code_id BIGINT NOT NULL,
    CONSTRAINT fk_cdc_claim FOREIGN KEY (claim_id) REFERENCES claim(id),
    CONSTRAINT fk_cdc_diagnosis FOREIGN KEY (diagnosis_code_id) REFERENCES diagnosis_code(id),
    CONSTRAINT uq_claim_diagnosis UNIQUE (claim_id, diagnosis_code_id)
);

-- ============================================================
-- 10. CLAIM_PROCEDURE_CODE — join table
-- ============================================================
CREATE TABLE claim_procedure_code (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    claim_id BIGINT NOT NULL,
    procedure_code_id BIGINT NOT NULL,
    modifier VARCHAR(10),
    CONSTRAINT fk_cpc_claim FOREIGN KEY (claim_id) REFERENCES claim(id),
    CONSTRAINT fk_cpc_procedure FOREIGN KEY (procedure_code_id) REFERENCES procedure_code(id)
);

-- ============================================================
-- 11. DENIAL_RULE — data-driven rules engine definitions
-- ============================================================
CREATE TABLE denial_rule (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rule_name VARCHAR(150) NOT NULL,
    condition_type ENUM('MISSING_FIELD', 'CODE_MISMATCH', 'INSURER_SPECIFIC', 'MISSING_MODIFIER') NOT NULL,
    condition_logic JSON,
    severity ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL DEFAULT 'MEDIUM',
    message VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 12. CLAIM_RISK_FLAG — rule violations triggered per claim
-- ============================================================
CREATE TABLE claim_risk_flag (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    claim_id BIGINT NOT NULL,
    denial_rule_id BIGINT NOT NULL,
    triggered_message VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_crf_claim FOREIGN KEY (claim_id) REFERENCES claim(id),
    CONSTRAINT fk_crf_rule FOREIGN KEY (denial_rule_id) REFERENCES denial_rule(id)
);

-- ============================================================
-- Sample seed data (optional — for local development/testing)
-- ============================================================

INSERT INTO clinic (name, address) VALUES
('Sunrise Diagnostic Clinic', '12 MG Road, Ahmedabad'),
('CityCare Physiotherapy', '45 SG Highway, Ahmedabad');

INSERT INTO insurer (name, rules_notes) VALUES
('Star Health Insurance', 'Requires modifier 25 for same-day evaluation and procedure claims'),
('ICICI Lombard', 'Requires pre-authorization number for procedures above INR 10,000');

INSERT INTO diagnosis_code (code, description, category) VALUES
('J20.9', 'Acute bronchitis, unspecified', 'Respiratory'),
('M54.5', 'Low back pain', 'Musculoskeletal'),
('E11.9', 'Type 2 diabetes mellitus without complications', 'Endocrine'),
('I10', 'Essential (primary) hypertension', 'Cardiovascular');

INSERT INTO procedure_code (code, description, category) VALUES
('99213', 'Office visit, established patient, low complexity', 'Evaluation & Management'),
('97110', 'Therapeutic exercise', 'Physical Therapy'),
('80050', 'General health panel', 'Laboratory'),
('93000', 'Electrocardiogram, routine ECG', 'Cardiology');

INSERT INTO denial_rule (rule_name, condition_type, condition_logic, severity, message, active) VALUES
('Missing pre-authorization for high-value procedure', 'MISSING_FIELD',
 JSON_OBJECT('field', 'preAuthNumber', 'threshold_amount', 10000), 'HIGH',
 'This procedure requires a pre-authorization number for claims above INR 10,000.', TRUE),
('Same-day visit requires modifier 25', 'MISSING_MODIFIER',
 JSON_OBJECT('procedure_code', '99213', 'required_modifier', '25'), 'MEDIUM',
 'Add modifier 25 when billing an office visit alongside a same-day procedure.', TRUE);

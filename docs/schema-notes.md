# ClaimGuard — Database Schema Notes

This document explains the database design decisions behind ClaimGuard's schema, for reference during development and for use in the project report.

---

## Design Principles

1. **Multi-tenant, shared-schema architecture** — every clinic-owned table carries a `clinic_id` foreign key. All queries are scoped by the logged-in user's clinic to keep data isolated between tenants, without the overhead of separate databases per tenant.
2. **Data-driven rules engine** — the `DenialRule` table stores rule definitions (not hardcoded logic), so new denial-risk rules can be added by inserting rows, not by changing code.
3. **Reference tables for codes** — `DiagnosisCode` and `ProcedureCode` are lightweight reference tables (seeded with ~30-50 realistic ICD-10/CPT-style codes) rather than free text, so the rules engine can perform genuine lookups and validation instead of string matching.
4. **Many-to-many where real-world flexibility demands it** — a claim can involve multiple doctors (`ClaimDoctor` join table), multiple diagnosis codes, and multiple procedure codes.

---

## Entity Overview

| Entity | Purpose |
|---|---|
| `Clinic` | Tenant record; root of data isolation |
| `User` | Login accounts — Admin, Doctor, or Billing Staff (role field) |
| `Patient` | Patient records, tied to a clinic |
| `Insurer` | Insurance companies claims are submitted to |
| `DiagnosisCode` | Reference table of ICD-10-style diagnosis codes |
| `ProcedureCode` | Reference table of CPT-style procedure codes |
| `Claim` | Core claim record — links patient, insurer, billing staff, status, risk score |
| `ClaimDoctor` | Join table — which doctor(s) are involved in a claim, and whether they've confirmed it |
| `ClaimDiagnosisCode` | Join table — diagnosis codes attached to a claim |
| `ClaimProcedureCode` | Join table — procedure codes attached to a claim, with optional modifier |
| `DenialRule` | Rule definitions for the rules engine |
| `ClaimRiskFlag` | Which rules were triggered for a specific claim, with explanation messages |

---

## Key Relationships

- **Clinic → User / Patient / Claim**: one-to-many (tenant isolation)
- **Claim → ClaimDoctor**: one-to-many (supports multiple doctors per claim)
- **Claim → ClaimDiagnosisCode / ClaimProcedureCode**: one-to-many (multiple codes per claim)
- **Claim → ClaimRiskFlag**: one-to-many (a claim can trigger multiple rule violations)
- **DenialRule → ClaimRiskFlag**: one-to-many (one rule can fire across many claims)

---

## Claim Status Lifecycle

```
DRAFT → CHECKED_CLEAN or CHECKED_FLAGGED → (fix issues, re-check) → SUBMITTED → APPROVED or DENIED
```

---

## Notes on Tradeoffs (for viva discussion)

- **`spring.jpa.hibernate.ddl-auto=update`** is used for development speed. In a real production deployment, this would be replaced with a proper migration tool (e.g., Flyway or Liquibase) to avoid uncontrolled schema drift.
- **Reference tables over full official code sets**: the real ICD-10 (~70,000 codes) and CPT (~10,000 codes) standards are far larger than needed for an MVP. A curated subset of ~30-50 codes is sufficient to demonstrate the rules engine's validation logic without unnecessary scope creep.
- **Shared-schema multi-tenancy** was chosen over schema-per-tenant or database-per-tenant because it's simpler to build and query within a 3–6 month MVP timeline, while still demonstrating real tenant-isolation logic.

---

## File Reference

See `er-diagram.mmd` in this same `docs/` folder for the full entity-relationship diagram (Mermaid format — viewable in most Markdown renderers, GitHub included, or at [mermaid.live](https://mermaid.live)).

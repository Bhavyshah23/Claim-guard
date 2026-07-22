# ClaimGuard

**Insurance Claim Pre-Screening Tool for Small Clinics**

An M.Sc. IT capstone project that helps small clinics and diagnostic labs catch insurance claim errors *before* submission — reducing claim denials, saving billing staff time, and protecting clinic revenue.

---

## Problem Statement

Small clinics and diagnostic labs lose significant revenue every year due to insurance claim denials caused by coding errors, missing documentation, or incomplete pre-authorizations. Most small practices can't afford full-time medical billing specialists or expensive enterprise claim-scrubbing suites (e.g., Athenahealth, Optum, Waystar), which are built for large hospital networks with dedicated IT teams.

**ClaimGuard** is a lightweight, standalone pre-screening tool purpose-built for small clinics — catching common denial-causing errors using a transparent, configurable rules engine, without requiring a big billing-suite subscription.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (`create-react-app`) |
| Backend | Java, Spring Boot (Spring Web, Spring Data JPA, Spring Security) |
| Database | MySQL |
| Auth | JWT-based authentication, role-based access control |
| Build Tools | Maven (backend), npm (frontend) |

---

## Project Structure

```
claimguard/
├── claimguard-backend/     # Spring Boot REST API
├── claimguard-client/      # React frontend
├── docs/                   # ER diagrams, API docs, screenshots, project report assets
├── .gitignore
├── LICENSE
└── README.md
```

---

## Roles

| Role | Responsibilities |
|---|---|
| **Admin** | Manage clinic staff, configure denial rules, view analytics |
| **Doctor** | Review and confirm diagnosis/procedure codes for their patients |
| **Billing Staff** | Enter claims, run risk checks, fix flagged issues, track submission status |

---

## Core Workflow

1. Billing staff enters a new claim (patient, diagnosis codes, procedure codes, insurer)
2. The Rules Engine evaluates the claim against configurable denial-risk rules
3. System returns a risk score with plain-English explanations for any flags
4. Staff fixes flagged issues and re-checks until the claim is clean
5. Admin dashboard tracks how many claims were caught before submission (= revenue saved)

---

## Status

🚧 **In development** — M.Sc. IT capstone project (academic MVP in progress)

---

## Getting Started

Setup instructions for the backend and frontend will be added here as each part is scaffolded.

---

## License

MIT
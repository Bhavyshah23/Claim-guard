package com.claimguard.backend.controller;

import com.claimguard.backend.dto.ClaimRequest;
import com.claimguard.backend.dto.ClaimResponse;
import com.claimguard.backend.dto.ClaimStatusUpdateRequest;
import com.claimguard.backend.service.ClaimService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/claims")
@RequiredArgsConstructor
public class ClaimController {

    private final ClaimService claimService;

    // Any authenticated clinic user can view claims (Doctors need this to see
    // claims they're attached to; Admin needs it for oversight/analytics)
    @GetMapping
    public ResponseEntity<List<ClaimResponse>> getAllClaims() {
        return ResponseEntity.ok(claimService.getAllClaims());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClaimResponse> getClaimById(@PathVariable Long id) {
        return ResponseEntity.ok(claimService.getClaimById(id));
    }

    // Only Admin and Billing Staff can create new claims
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'BILLING_STAFF')")
    public ResponseEntity<ClaimResponse> createClaim(@Valid @RequestBody ClaimRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(claimService.createClaim(request));
    }

    // Edit a draft or already-screened claim. Blocked once submitted.
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BILLING_STAFF')")
    public ResponseEntity<ClaimResponse> updateClaim(
            @PathVariable Long id, @Valid @RequestBody ClaimRequest request) {
        return ResponseEntity.ok(claimService.updateClaim(id, request));
    }

    // Only a clean claim can move into the payer submission stage.
    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAnyRole('ADMIN', 'BILLING_STAFF')")
    public ResponseEntity<ClaimResponse> submitClaim(@PathVariable Long id) {
        return ResponseEntity.ok(claimService.submitClaim(id));
    }

    // Simulated payer decision - Admin records APPROVED or DENIED.
    @PutMapping("/{id}/outcome")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ClaimResponse> resolveClaim(
            @PathVariable Long id, @Valid @RequestBody ClaimStatusUpdateRequest request) {
        return ResponseEntity.ok(claimService.resolveClaim(id, request));
    }

    // Runs the rules engine against this claim. Callable repeatedly -
    // e.g. billing staff fixes a flagged issue, then re-checks to confirm it's clean.
    @PostMapping("/{id}/check")
    @PreAuthorize("hasAnyRole('ADMIN', 'BILLING_STAFF')")
    public ResponseEntity<ClaimResponse> checkClaim(@PathVariable Long id) {
        return ResponseEntity.ok(claimService.checkClaim(id));
    }

    // Only a Doctor can confirm - and only their OWN assignment on the claim
    // (enforced inside the service, since a doctor confirms based on their
    // own JWT identity, not a doctorId passed in the request)
    @PutMapping("/{id}/confirm")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ClaimResponse> confirmClaim(@PathVariable Long id) {
        return ResponseEntity.ok(claimService.confirmClaim(id));
    }
}
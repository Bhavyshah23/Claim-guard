package com.claimguard.backend.controller;

import com.claimguard.backend.dto.ClaimRequest;
import com.claimguard.backend.dto.ClaimResponse;
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

    // Runs the rules engine against this claim. Callable repeatedly -
    // e.g. billing staff fixes a flagged issue, then re-checks to confirm it's clean.
    @PostMapping("/{id}/check")
    @PreAuthorize("hasAnyRole('ADMIN', 'BILLING_STAFF')")
    public ResponseEntity<ClaimResponse> checkClaim(@PathVariable Long id) {
        return ResponseEntity.ok(claimService.checkClaim(id));
    }
}
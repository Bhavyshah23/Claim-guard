package com.claimguard.backend.controller;

import com.claimguard.backend.dto.InsurerRequest;
import com.claimguard.backend.dto.InsurerResponse;
import com.claimguard.backend.service.InsurerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/insurers")
@RequiredArgsConstructor
public class InsurerController {

    private final InsurerService insurerService;

    @GetMapping
    public ResponseEntity<List<InsurerResponse>> getAllInsurers() {
        return ResponseEntity.ok(insurerService.getAllInsurers());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<InsurerResponse> createInsurer(@Valid @RequestBody InsurerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(insurerService.createInsurer(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<InsurerResponse> updateInsurer(
            @PathVariable Long id, @Valid @RequestBody InsurerRequest request) {
        return ResponseEntity.ok(insurerService.updateInsurer(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteInsurer(@PathVariable Long id) {
        insurerService.deleteInsurer(id);
        return ResponseEntity.noContent().build();
    }
}
package com.claimguard.backend.controller;

import com.claimguard.backend.dto.DenialRuleRequest;
import com.claimguard.backend.dto.DenialRuleResponse;
import com.claimguard.backend.service.DenialRuleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rules")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class DenialRuleController {

    private final DenialRuleService denialRuleService;

    @GetMapping
    public ResponseEntity<List<DenialRuleResponse>> getAllRules() {
        return ResponseEntity.ok(denialRuleService.getAllRules());
    }

    @PostMapping
    public ResponseEntity<DenialRuleResponse> createRule(@Valid @RequestBody DenialRuleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(denialRuleService.createRule(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DenialRuleResponse> updateRule(
            @PathVariable Long id, @Valid @RequestBody DenialRuleRequest request) {
        return ResponseEntity.ok(denialRuleService.updateRule(id, request));
    }

    @PatchMapping("/{id}/active")
    public ResponseEntity<DenialRuleResponse> toggleActive(@PathVariable Long id) {
        return ResponseEntity.ok(denialRuleService.toggleActive(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRule(@PathVariable Long id) {
        denialRuleService.deleteRule(id);
        return ResponseEntity.noContent().build();
    }
}

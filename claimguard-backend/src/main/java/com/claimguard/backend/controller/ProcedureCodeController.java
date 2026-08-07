package com.claimguard.backend.controller;

import com.claimguard.backend.dto.CodeRequest;
import com.claimguard.backend.dto.CodeResponse;
import com.claimguard.backend.service.ProcedureCodeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/procedure-codes")
@RequiredArgsConstructor
public class ProcedureCodeController {

    private final ProcedureCodeService procedureCodeService;

    @GetMapping
    public ResponseEntity<List<CodeResponse>> getAllCodes() {
        return ResponseEntity.ok(procedureCodeService.getAllCodes());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CodeResponse> createCode(@Valid @RequestBody CodeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(procedureCodeService.createCode(request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCode(@PathVariable Long id) {
        procedureCodeService.deleteCode(id);
        return ResponseEntity.noContent().build();
    }
}
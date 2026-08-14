package com.claimguard.backend.controller;

import com.claimguard.backend.dto.CreateStaffRequest;
import com.claimguard.backend.dto.StaffResponse;
import com.claimguard.backend.service.StaffService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Every endpoint here is Admin-only - this is how a clinic's Admin builds out
// their team of Doctors and Billing Staff, replacing the manual SQL inserts
// we used earlier just to unblock testing.
@RestController
@RequestMapping("/api/admin/staff")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class StaffController {

    private final StaffService staffService;

    @PostMapping
    public ResponseEntity<StaffResponse> createStaff(@Valid @RequestBody CreateStaffRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(staffService.createStaff(request));
    }

    @GetMapping
    public ResponseEntity<List<StaffResponse>> getAllStaff() {
        return ResponseEntity.ok(staffService.getAllStaff());
    }
}
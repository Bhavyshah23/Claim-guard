package com.claimguard.backend.service;

import com.claimguard.backend.dto.CreateStaffRequest;
import com.claimguard.backend.dto.StaffResponse;
import com.claimguard.backend.entity.Clinic;
import com.claimguard.backend.entity.Role;
import com.claimguard.backend.entity.User;
import com.claimguard.backend.exception.AuthException;
import com.claimguard.backend.exception.ResourceNotFoundException;
import com.claimguard.backend.repository.ClinicRepository;
import com.claimguard.backend.repository.UserRepository;
import com.claimguard.backend.security.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StaffService {

    private final UserRepository userRepository;
    private final ClinicRepository clinicRepository;
    private final PasswordEncoder passwordEncoder;
    private final CurrentUserProvider currentUserProvider;

    @Transactional
    public StaffResponse createStaff(CreateStaffRequest request) {

        // Block creating another Admin through this endpoint - Admin accounts
        // are only created via the original clinic registration flow.
        if (request.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("Cannot create an Admin account through staff management");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AuthException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AuthException("Email is already registered");
        }

        Long clinicId = currentUserProvider.getCurrentClinicId();
        Clinic clinic = clinicRepository.findById(clinicId)
                .orElseThrow(() -> new ResourceNotFoundException("Clinic not found"));

        User staff = User.builder()
                .clinic(clinic)
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .role(request.getRole())
                .build();

        staff = userRepository.save(staff);
        return toResponse(staff);
    }

    // Lists every staff member (Doctor + Billing Staff, and the Admin too)
    // belonging to the current logged-in Admin's clinic only.
    public List<StaffResponse> getAllStaff() {
        Long clinicId = currentUserProvider.getCurrentClinicId();
        return userRepository.findByClinicId(clinicId).stream()
                .map(this::toResponse)
                .toList();
    }

    private StaffResponse toResponse(User user) {
        return StaffResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
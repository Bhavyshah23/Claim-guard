package com.claimguard.backend.service;

import com.claimguard.backend.dto.AuthResponse;
import com.claimguard.backend.dto.LoginRequest;
import com.claimguard.backend.dto.RegisterRequest;
import com.claimguard.backend.entity.Clinic;
import com.claimguard.backend.entity.Role;
import com.claimguard.backend.entity.User;
import com.claimguard.backend.exception.AuthException;
import com.claimguard.backend.repository.ClinicRepository;
import com.claimguard.backend.repository.UserRepository;
import com.claimguard.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final ClinicRepository clinicRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    // Registers a brand new clinic AND its first Admin user in one transaction.
    // @Transactional ensures both the Clinic and User are saved together -
    // if anything fails partway through, neither gets persisted (no orphaned clinic).
    @Transactional
    public AuthResponse register(RegisterRequest request) {

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AuthException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AuthException("Email is already registered");
        }

        Clinic clinic = Clinic.builder()
                .name(request.getClinicName())
                .build();
        clinic = clinicRepository.save(clinic);

        User adminUser = User.builder()
                .clinic(clinic)
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .role(Role.ADMIN)
                .build();
        adminUser = userRepository.save(adminUser);

        String token = jwtService.generateToken(adminUser);

        return AuthResponse.builder()
                .token(token)
                .userId(adminUser.getId())
                .username(adminUser.getUsername())
                .role(adminUser.getRole())
                .clinicId(clinic.getId())
                .clinicName(clinic.getName())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
        } catch (BadCredentialsException ex) {
            throw new AuthException("Invalid username or password");
        }

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new AuthException("Invalid username or password"));

        String token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .role(user.getRole())
                .clinicId(user.getClinic().getId())
                .clinicName(user.getClinic().getName())
                .build();
    }
}
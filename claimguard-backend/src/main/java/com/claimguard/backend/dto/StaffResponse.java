package com.claimguard.backend.dto;

import com.claimguard.backend.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffResponse {
    private Long id;
    private String username;
    private String email;
    private Role role;
    private LocalDateTime createdAt;
}
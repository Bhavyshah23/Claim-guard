package com.claimguard.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

// Never return the JPA entity directly from a controller - DTOs keep the API
// contract stable even if the entity's internal structure changes later,
// and avoid accidentally leaking the "clinic" relationship object in JSON.
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private LocalDate dateOfBirth;
    private String gender;
    private String contactInfo;
}
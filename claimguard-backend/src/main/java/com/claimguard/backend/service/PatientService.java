package com.claimguard.backend.service;

import com.claimguard.backend.dto.PatientRequest;
import com.claimguard.backend.dto.PatientResponse;
import com.claimguard.backend.entity.Clinic;
import com.claimguard.backend.entity.Patient;
import com.claimguard.backend.exception.ResourceNotFoundException;
import com.claimguard.backend.repository.ClinicRepository;
import com.claimguard.backend.repository.PatientRepository;
import com.claimguard.backend.security.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;
    private final ClinicRepository clinicRepository;
    private final CurrentUserProvider currentUserProvider;

    public PatientResponse createPatient(PatientRequest request) {
        Long clinicId = currentUserProvider.getCurrentClinicId();
        Clinic clinic = clinicRepository.findById(clinicId)
                .orElseThrow(() -> new ResourceNotFoundException("Clinic not found"));

        Patient patient = Patient.builder()
                .clinic(clinic)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .contactInfo(request.getContactInfo())
                .build();

        patient = patientRepository.save(patient);
        return toResponse(patient);
    }

    // Only returns patients belonging to the logged-in user's clinic -
    // this is the tenant isolation enforcement point for this entity.
    public List<PatientResponse> getAllPatients() {
        Long clinicId = currentUserProvider.getCurrentClinicId();
        return patientRepository.findByClinicId(clinicId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public PatientResponse getPatientById(Long id) {
        Patient patient = getPatientScoped(id);
        return toResponse(patient);
    }

    public PatientResponse updatePatient(Long id, PatientRequest request) {
        Patient patient = getPatientScoped(id);

        patient.setFirstName(request.getFirstName());
        patient.setLastName(request.getLastName());
        patient.setDateOfBirth(request.getDateOfBirth());
        patient.setGender(request.getGender());
        patient.setContactInfo(request.getContactInfo());

        patient = patientRepository.save(patient);
        return toResponse(patient);
    }

    public void deletePatient(Long id) {
        Patient patient = getPatientScoped(id);
        patientRepository.delete(patient);
    }

    // Fetches a patient AND verifies it belongs to the current user's clinic -
    // prevents one clinic from reading/editing/deleting another clinic's data
    // just by guessing an ID (a critical multi-tenant security check).
    private Patient getPatientScoped(Long id) {
        Long clinicId = currentUserProvider.getCurrentClinicId();
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));

        if (!patient.getClinic().getId().equals(clinicId)) {
            throw new ResourceNotFoundException("Patient not found with id: " + id);
        }
        return patient;
    }

    private PatientResponse toResponse(Patient patient) {
        return PatientResponse.builder()
                .id(patient.getId())
                .firstName(patient.getFirstName())
                .lastName(patient.getLastName())
                .dateOfBirth(patient.getDateOfBirth())
                .gender(patient.getGender())
                .contactInfo(patient.getContactInfo())
                .build();
    }
}
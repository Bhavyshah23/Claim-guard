package com.claimguard.backend.repository;

import com.claimguard.backend.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {

    // Used to list only the patients belonging to the logged-in user's clinic
    // (enforces tenant isolation at the query level)
    List<Patient> findByClinicId(Long clinicId);
}
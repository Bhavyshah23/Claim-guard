package com.claimguard.backend.repository;

import com.claimguard.backend.entity.Clinic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClinicRepository extends JpaRepository<Clinic, Long> {
    // JpaRepository already provides save(), findById(), findAll(), deleteById(), etc.
    // Add custom query methods here as needed, e.g.:
    // Optional<Clinic> findByName(String name);
}
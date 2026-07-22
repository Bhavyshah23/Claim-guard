package com.claimguard.backend.repository;

import com.claimguard.backend.entity.DiagnosisCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DiagnosisCodeRepository extends JpaRepository<DiagnosisCode, Long> {

    // Used by the rules engine to look up a code and validate it exists
    Optional<DiagnosisCode> findByCode(String code);
}
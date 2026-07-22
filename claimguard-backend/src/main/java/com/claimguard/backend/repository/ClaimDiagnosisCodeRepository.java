package com.claimguard.backend.repository;

import com.claimguard.backend.entity.ClaimDiagnosisCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClaimDiagnosisCodeRepository extends JpaRepository<ClaimDiagnosisCode, Long> {

    List<ClaimDiagnosisCode> findByClaimId(Long claimId);
}
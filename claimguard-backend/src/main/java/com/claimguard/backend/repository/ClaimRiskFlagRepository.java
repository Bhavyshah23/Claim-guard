package com.claimguard.backend.repository;

import com.claimguard.backend.entity.ClaimRiskFlag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClaimRiskFlagRepository extends JpaRepository<ClaimRiskFlag, Long> {

    List<ClaimRiskFlag> findByClaimId(Long claimId);
}
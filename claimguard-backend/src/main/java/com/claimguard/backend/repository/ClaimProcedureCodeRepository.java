package com.claimguard.backend.repository;

import com.claimguard.backend.entity.ClaimProcedureCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClaimProcedureCodeRepository extends JpaRepository<ClaimProcedureCode, Long> {

    List<ClaimProcedureCode> findByClaimId(Long claimId);
}
package com.claimguard.backend.repository;

import com.claimguard.backend.entity.Claim;
import com.claimguard.backend.entity.ClaimStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, Long> {

    // Tenant-scoped queries - every claim listing should filter by clinic
    List<Claim> findByClinicId(Long clinicId);

    List<Claim> findByClinicIdAndStatus(Long clinicId, ClaimStatus status);

    // Claims entered by a specific billing staff member
    List<Claim> findByCreatedByIdAndClinicId(Long userId, Long clinicId);
}
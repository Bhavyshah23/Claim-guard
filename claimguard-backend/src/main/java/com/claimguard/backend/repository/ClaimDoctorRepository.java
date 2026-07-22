package com.claimguard.backend.repository;

import com.claimguard.backend.entity.ClaimDoctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClaimDoctorRepository extends JpaRepository<ClaimDoctor, Long> {

    List<ClaimDoctor> findByClaimId(Long claimId);

    // Claims awaiting a specific doctor's confirmation
    List<ClaimDoctor> findByDoctorIdAndConfirmedFalse(Long doctorId);
}
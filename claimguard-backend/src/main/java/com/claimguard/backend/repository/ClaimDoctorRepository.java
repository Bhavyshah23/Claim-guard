package com.claimguard.backend.repository;

import com.claimguard.backend.entity.ClaimDoctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClaimDoctorRepository extends JpaRepository<ClaimDoctor, Long> {

    // ADD THIS METHOD to your existing ClaimDoctorRepository.java interface:

    Optional<ClaimDoctor> findByClaimIdAndDoctorId(Long claimId, Long doctorId);

    // Also add this import at the top of the file if not already present:
    // import java.util.Optional;

    List<ClaimDoctor> findByClaimId(Long claimId);

    // Claims awaiting a specific doctor's confirmation
    List<ClaimDoctor> findByDoctorIdAndConfirmedFalse(Long doctorId);
}
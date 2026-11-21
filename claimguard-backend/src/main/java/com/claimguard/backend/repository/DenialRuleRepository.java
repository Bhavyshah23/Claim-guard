package com.claimguard.backend.repository;

import com.claimguard.backend.entity.DenialRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DenialRuleRepository extends JpaRepository<DenialRule, Long> {

    List<DenialRule> findByClinicId(Long clinicId);

    // The Rules Engine loads only this clinic's active rules
    List<DenialRule> findByClinicIdAndActiveTrue(Long clinicId);

    List<DenialRule> findByClinicIsNull();
}
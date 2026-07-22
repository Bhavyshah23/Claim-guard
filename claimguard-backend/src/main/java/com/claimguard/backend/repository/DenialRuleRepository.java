package com.claimguard.backend.repository;

import com.claimguard.backend.entity.DenialRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DenialRuleRepository extends JpaRepository<DenialRule, Long> {

    // The Rules Engine loads only active rules when evaluating a claim
    List<DenialRule> findByActiveTrue();
}
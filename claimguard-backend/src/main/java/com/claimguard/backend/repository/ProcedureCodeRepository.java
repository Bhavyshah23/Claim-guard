package com.claimguard.backend.repository;

import com.claimguard.backend.entity.ProcedureCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProcedureCodeRepository extends JpaRepository<ProcedureCode, Long> {

    // Used by the rules engine to look up a code and validate it exists
    Optional<ProcedureCode> findByCode(String code);
}
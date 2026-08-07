package com.claimguard.backend.service;

import com.claimguard.backend.dto.CodeRequest;
import com.claimguard.backend.dto.CodeResponse;
import com.claimguard.backend.entity.ProcedureCode;
import com.claimguard.backend.exception.ResourceNotFoundException;
import com.claimguard.backend.repository.ProcedureCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProcedureCodeService {

    private final ProcedureCodeRepository procedureCodeRepository;

    public List<CodeResponse> getAllCodes() {
        return procedureCodeRepository.findAll().stream().map(this::toResponse).toList();
    }

    public CodeResponse createCode(CodeRequest request) {
        ProcedureCode code = ProcedureCode.builder()
                .code(request.getCode())
                .description(request.getDescription())
                .category(request.getCategory())
                .build();
        return toResponse(procedureCodeRepository.save(code));
    }

    public void deleteCode(Long id) {
        if (!procedureCodeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Procedure code not found with id: " + id);
        }
        procedureCodeRepository.deleteById(id);
    }

    private CodeResponse toResponse(ProcedureCode code) {
        return CodeResponse.builder()
                .id(code.getId())
                .code(code.getCode())
                .description(code.getDescription())
                .category(code.getCategory())
                .build();
    }
}
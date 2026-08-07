package com.claimguard.backend.service;

import com.claimguard.backend.dto.CodeRequest;
import com.claimguard.backend.dto.CodeResponse;
import com.claimguard.backend.entity.DiagnosisCode;
import com.claimguard.backend.exception.ResourceNotFoundException;
import com.claimguard.backend.repository.DiagnosisCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DiagnosisCodeService {

    private final DiagnosisCodeRepository diagnosisCodeRepository;

    public List<CodeResponse> getAllCodes() {
        return diagnosisCodeRepository.findAll().stream().map(this::toResponse).toList();
    }

    public CodeResponse createCode(CodeRequest request) {
        DiagnosisCode code = DiagnosisCode.builder()
                .code(request.getCode())
                .description(request.getDescription())
                .category(request.getCategory())
                .build();
        return toResponse(diagnosisCodeRepository.save(code));
    }

    public void deleteCode(Long id) {
        if (!diagnosisCodeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Diagnosis code not found with id: " + id);
        }
        diagnosisCodeRepository.deleteById(id);
    }

    private CodeResponse toResponse(DiagnosisCode code) {
        return CodeResponse.builder()
                .id(code.getId())
                .code(code.getCode())
                .description(code.getDescription())
                .category(code.getCategory())
                .build();
    }
}
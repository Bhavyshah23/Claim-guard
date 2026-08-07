package com.claimguard.backend.service;

import com.claimguard.backend.dto.InsurerRequest;
import com.claimguard.backend.dto.InsurerResponse;
import com.claimguard.backend.entity.Insurer;
import com.claimguard.backend.exception.ResourceNotFoundException;
import com.claimguard.backend.repository.InsurerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InsurerService {

    private final InsurerRepository insurerRepository;

    // Insurers are shared reference data (not clinic-scoped) - every clinic
    // using this ClaimGuard instance sees the same list of insurance companies.
    public List<InsurerResponse> getAllInsurers() {
        return insurerRepository.findAll().stream().map(this::toResponse).toList();
    }

    public InsurerResponse createInsurer(InsurerRequest request) {
        Insurer insurer = Insurer.builder()
                .name(request.getName())
                .rulesNotes(request.getRulesNotes())
                .build();
        return toResponse(insurerRepository.save(insurer));
    }

    public InsurerResponse updateInsurer(Long id, InsurerRequest request) {
        Insurer insurer = insurerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Insurer not found with id: " + id));
        insurer.setName(request.getName());
        insurer.setRulesNotes(request.getRulesNotes());
        return toResponse(insurerRepository.save(insurer));
    }

    public void deleteInsurer(Long id) {
        if (!insurerRepository.existsById(id)) {
            throw new ResourceNotFoundException("Insurer not found with id: " + id);
        }
        insurerRepository.deleteById(id);
    }

    private InsurerResponse toResponse(Insurer insurer) {
        return InsurerResponse.builder()
                .id(insurer.getId())
                .name(insurer.getName())
                .rulesNotes(insurer.getRulesNotes())
                .build();
    }
}
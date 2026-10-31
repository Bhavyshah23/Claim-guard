package com.claimguard.backend.dto;

import com.claimguard.backend.entity.ClaimStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClaimStatusUpdateRequest {

    @NotNull(message = "Outcome status is required")
    private ClaimStatus status;
}

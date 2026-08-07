package com.claimguard.backend.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

// Small helper so controllers/services can easily ask "who is making this request,
// and which clinic do they belong to?" without repeating SecurityContextHolder
// boilerplate everywhere. Every tenant-scoped query in the app will use this.
@Component
public class CurrentUserProvider {

    public CustomUserDetails getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (CustomUserDetails) authentication.getPrincipal();
    }

    public Long getCurrentClinicId() {
        return getCurrentUser().getUser().getClinic().getId();
    }

    public Long getCurrentUserId() {
        return getCurrentUser().getUser().getId();
    }
}
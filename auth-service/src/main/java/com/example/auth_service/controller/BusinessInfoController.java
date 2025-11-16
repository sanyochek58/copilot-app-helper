package com.example.auth_service.controller;

import com.example.auth_service.entity.dto.Response_BusinessContextDTO;
import com.example.auth_service.exceptions.BusinessNotFound;
import com.example.auth_service.services.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/business")
public class BusinessInfoController {

    private final AuthService authService;

    @GetMapping("/{businessId}")
    public ResponseEntity<Response_BusinessContextDTO> getBusinessInfo(
            @PathVariable UUID businessId,
            @AuthenticationPrincipal Jwt jwt) throws BusinessNotFound {

        String businessIdFromToken = jwt.getClaimAsString("businessId");

        if (businessIdFromToken == null || !businessId.toString().equals(businessIdFromToken)) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(authService.businessInfo(businessId));
    }
}

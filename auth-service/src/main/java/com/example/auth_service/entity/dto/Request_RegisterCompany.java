package com.example.auth_service.entity.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record Request_RegisterCompany(
        @Email
        @NotBlank
        String ownerEmail,

        @NotBlank
        String ownerPassword,

        @NotBlank
        String ownerName,

        @NotBlank
        String companyName,

        @NotBlank
        String area,

        Long profit,

        List<EmployeeDTO> employees

) { }

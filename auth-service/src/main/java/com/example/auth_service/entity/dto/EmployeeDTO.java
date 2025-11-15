package com.example.auth_service.entity.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record EmployeeDTO(@NotBlank String name, @NotBlank @Email String email, @NotBlank String position) { }

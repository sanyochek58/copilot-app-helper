package com.example.auth_service.entity.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record Request_LoginDTO(@Email @NotBlank String email, @NotBlank String password) { }

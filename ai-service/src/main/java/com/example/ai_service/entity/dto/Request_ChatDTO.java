package com.example.ai_service.entity.dto;

import jakarta.validation.constraints.NotBlank;

public record Request_ChatDTO(@NotBlank String message, String mode) { }

package com.example.auth_service.entity.dto;

import lombok.Data;

import java.util.List;

public record Response_BusinessContextDTO(
        String businessId,
        String businessName,
        String area,
        String ownerName,
        String profit,
        List<EmployeeDTO> employees
) { }

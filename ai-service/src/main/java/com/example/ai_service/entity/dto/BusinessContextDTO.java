package com.example.ai_service.entity.dto;

import java.util.List;

public record BusinessContextDTO(
        String businessId,
        String businessName,
        String area,
        String ownerName,
        String profit,
        List<EmployeeDTO> employees
) {}
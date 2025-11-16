package com.example.auth_service.repository;

import com.example.auth_service.entity.model.Business;
import com.example.auth_service.entity.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EmployeeRepository extends JpaRepository<Employee, UUID> {
    List<Employee> findByBusiness(Business business);
}

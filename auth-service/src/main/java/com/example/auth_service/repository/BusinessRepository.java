package com.example.auth_service.repository;

import com.example.auth_service.entity.model.Business;
import com.example.auth_service.entity.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface BusinessRepository extends JpaRepository<Business, UUID> {
    Optional<Business> findFirstByOwner(User owner);
}

package com.example.auth_service.controller;

import com.example.auth_service.entity.dto.*;
import com.example.auth_service.exceptions.BadCredentialsException;
import com.example.auth_service.exceptions.BusinessNotFound;
import com.example.auth_service.exceptions.UserAlreadyExistsException;
import com.example.auth_service.exceptions.UserNotFoundException;
import com.example.auth_service.services.AuthServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthServiceImpl authService;

    @PostMapping("/register-company")
    public ResponseEntity<Response_RegisterCompanyDTO> register(@Valid @RequestBody Request_RegisterCompany request) throws UserAlreadyExistsException {
        Response_RegisterCompanyDTO response = authService.registerCompany(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<Response_LoginDTO> login(@Valid @RequestBody Request_LoginDTO request) throws UserNotFoundException, BadCredentialsException, BusinessNotFound {
        Response_LoginDTO response = authService.loginUser(request);
        return ResponseEntity.ok(response);
    }

}

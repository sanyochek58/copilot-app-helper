package com.example.auth_service.services;

import com.example.auth_service.entity.dto.*;
import com.example.auth_service.exceptions.BadCredentialsException;
import com.example.auth_service.exceptions.BusinessNotFound;
import com.example.auth_service.exceptions.UserAlreadyExistsException;
import com.example.auth_service.exceptions.UserNotFoundException;

import java.util.UUID;

public interface AuthService {
    Response_LoginDTO loginUser(Request_LoginDTO request) throws UserNotFoundException, BadCredentialsException, BusinessNotFound;
    Response_RegisterCompanyDTO registerCompany(Request_RegisterCompany request) throws UserAlreadyExistsException;
    Response_BusinessContextDTO businessInfo(UUID businessId) throws BusinessNotFound;
}

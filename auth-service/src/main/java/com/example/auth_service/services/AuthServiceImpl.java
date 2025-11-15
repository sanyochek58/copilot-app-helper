package com.example.auth_service.services;

import com.example.auth_service.entity.dto.*;
import com.example.auth_service.entity.model.Business;
import com.example.auth_service.entity.model.Employee;
import com.example.auth_service.entity.model.User;
import com.example.auth_service.exceptions.BadCredentialsException;
import com.example.auth_service.exceptions.BusinessNotFound;
import com.example.auth_service.exceptions.UserAlreadyExistsException;
import com.example.auth_service.exceptions.UserNotFoundException;
import com.example.auth_service.repository.BusinessRepository;
import com.example.auth_service.repository.EmployeeRepository;
import com.example.auth_service.repository.UserRepository;
import com.example.auth_service.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final BusinessRepository businessRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder encoder;
    private final JwtService jwtService;

    private static final Logger logger = LoggerFactory.getLogger(AuthServiceImpl.class);

    @Override
    public Response_RegisterCompanyDTO registerCompany(Request_RegisterCompany dto) throws UserAlreadyExistsException{
        if(userRepository.findByEmail(dto.ownerEmail()).isPresent()){
            throw new UserAlreadyExistsException("User already exists !");
        }
        //Босс
        User user = new User();
        user.setName(dto.ownerName());
        user.setEmail(dto.ownerEmail());
        user.setPassword(encoder.encode(dto.ownerPassword()));

        user = userRepository.save(user);
        logger.debug("User has been registered successfully");

        //Компания
        Business business = new Business();
        business.setName(dto.companyName());
        business.setArea(dto.area());
        business.setProfit(dto.profit());
        business.setOwner(user);

        business = businessRepository.save(business);
        logger.debug("Business has been registered successfully");

        //Сотрудники компании
        if(dto.employees() != null){
            Business finalBusiness = business;
            List<Employee> employees = dto.employees().stream().map(e -> Employee.builder()
                            .business(finalBusiness)
                            .name(e.name())
                            .email(e.email())
                            .position(e.position())
                            .build()
            )
                            .toList();
            employeeRepository.saveAll(employees);
            logger.debug("Employees have been registered successfully");
        }

        String token = jwtService.generateToken(user.getUuid(), user.getEmail(), business.getUuid());
        logger.debug("Token has been created successfully");
        return new Response_RegisterCompanyDTO(token);
    }

    @Override
    public Response_LoginDTO loginUser(Request_LoginDTO dto) throws UserNotFoundException, BadCredentialsException, BusinessNotFound {
        Optional<User> user = userRepository.findByEmail(dto.email());
        if(user.isEmpty()){
            logger.info("User with email {} not found", dto.email());
            throw new UserNotFoundException("User not found!");
        }

        if(!encoder.matches(dto.password(),user.get().getPassword())){
            logger.info("Passwords don't match");
            throw new BadCredentialsException("Wrong password!");
        }

        Business business = businessRepository.findFirstByOwner(user.get()).orElseThrow(() -> new BusinessNotFound("Business for user not found !"));

        String token = jwtService.generateToken(user.get().getUuid(), user.get().getEmail(), business.getUuid());
        logger.info("Token generated");

        return new Response_LoginDTO(token);
    }


}

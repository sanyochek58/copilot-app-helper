package com.example.auth_service.exceptions;

public class BadCredentialsException extends Exception {
    public BadCredentialsException(String message) {
        super(message);
    }
}

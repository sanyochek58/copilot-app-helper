package com.example.auth_service.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;

@Configuration
public class LoggingConfiguration {
    private static final Logger log = LoggerFactory.getLogger(LoggingConfiguration.class);

    @PostConstruct
    public void init() {
        log.info("Init logging");
    }
}

package com.example.ai_service.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class OpenAiClientConfig {

    @Value("${spring.ai.openai.baseUrl}")
    private String baseUrl;

    @Value("${spring.ai.openai.apiKey}")
    private String apiKey;

    @Bean(name = "openAiWebClient")
    public WebClient openAiWebClient() {
        return WebClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .defaultHeader("Content-Type","application/json")
                .build();
    }
}

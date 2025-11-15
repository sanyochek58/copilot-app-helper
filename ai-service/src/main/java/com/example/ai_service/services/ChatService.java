package com.example.ai_service.services;

import com.example.ai_service.entity.dto.OpenAIChatRequest;
import com.example.ai_service.entity.dto.OpenAIChatResponse;
import com.example.ai_service.prompts.ConstantPrompts;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final WebClient webClient;
    private final ConstantPrompts prompts;

    private static final Logger logger = LoggerFactory.getLogger(ChatService.class);

    @Value("${spring.ai.openai.chat.options.model}")
    private String model;

    public String chat(String message, String mode) {
        String systemPrompt = prompts.getSystemPromptCop();

        OpenAIChatRequest request = new OpenAIChatRequest(
                model,
                List.of(
                        new OpenAIChatRequest.Message("system", systemPrompt),
                        new OpenAIChatRequest.Message("user", message) // ← теперь content
                ),
                0.2
        );

        try {
            OpenAIChatResponse response = webClient.post()
                    .uri("/chat/completions")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(OpenAIChatResponse.class)
                    .block();

            if (response == null || response.getChoices() == null || response.getChoices().isEmpty()) {
                return "Не удалось получить ответ от модели.";
            }

            return response.getChoices().get(0).getMessage().getContent();
        } catch (Exception e) {
            logger.error("Error calling Groq API", e);
            return "Ошибка при обращении к AI сервису: " + e.getMessage();
        }
    }

}

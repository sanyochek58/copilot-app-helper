package com.example.ai_service.services;

import com.example.ai_service.entity.dto.BusinessContextDTO;
import com.example.ai_service.entity.dto.OpenAIChatRequest;
import com.example.ai_service.entity.dto.OpenAIChatResponse;
import com.example.ai_service.prompts.ConstantPrompts;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;

@Service
public class ChatService {

    private final WebClient llmWebClient;
    private final WebClient authWebCLient;
    private final ConstantPrompts prompts;

    private static final Logger logger = LoggerFactory.getLogger(ChatService.class);

    @Value("${spring.ai.openai.chat.options.model}")
    private String model;

    public ChatService(@Qualifier("openAiWebClient") WebClient llmWebClient, @Qualifier("authWebClient") WebClient authWebCLient, ConstantPrompts prompts) {
        this.llmWebClient = llmWebClient;
        this.authWebCLient = authWebCLient;
        this.prompts = prompts;
    }

    public String chat(String message, String mode, String businessId, String authToken) {
        BusinessContextDTO businessContext = null;
        try {
            businessContext = authWebCLient.get()
                    .uri("/api/business/{businessId}", businessId)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + authToken)
                    .retrieve()
                    .bodyToMono(BusinessContextDTO.class)
                    .block();
        } catch (Exception e) {
            logger.error(e.getMessage(), e);
        }

        String busContext = "";
        if (businessContext != null) {
            String employeeText = businessContext.employees().isEmpty() ? "Нет сотрудников" : businessContext.employees().stream()
                    .map(e -> " - " + e.name() + " (" + e.position() + ", " + e.email() + ")").reduce((a, b) -> a + "\n" + b).orElse("");
            busContext = """
                    Контекст бизнеса:
                    - ID: %s
                    - Название: %s
                    - Сфера: %s
                    - Владелец: %s
                    - Прибыль: %s
                    - Сотрудники:
                    %s
                    """.formatted(
                    businessContext.businessId(),
                    businessContext.businessName(),
                    businessContext.area(),
                    businessContext.ownerName(),
                    businessContext.profit(),
                    employeeText
            );
        }

        String basePrompt = switch (mode == null ? "" : mode) {
            case "copilot" -> prompts.getSystemPromptCop();
            default -> "";
        };

        String systemPrompt = basePrompt + (busContext.isEmpty() ? "" : ("\n\n" + busContext));

        List<OpenAIChatRequest.Message> messages = List.of(
                new OpenAIChatRequest.Message("system", systemPrompt),
                new OpenAIChatRequest.Message("user", message)
        );

        OpenAIChatRequest request = new OpenAIChatRequest(model, messages, 0.2);

        try{
            OpenAIChatResponse response = llmWebClient.post()
                    .uri("/chat/completions")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(OpenAIChatResponse.class)
                    .block();

            if(response == null || response.getChoices() == null || response.getChoices().isEmpty()){
                return "Не удалось получить ответ от модели.";
            }

        return response.getChoices().get(0).getMessage().getContent();

        }catch (Exception e) {
            logger.error("Error calling Groq API", e);
            return "Ошибка при обращении к AI сервису: " + e.getMessage();
        }
    }
}

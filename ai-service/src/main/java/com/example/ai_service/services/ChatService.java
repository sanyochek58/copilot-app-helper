package com.example.ai_service.services;

import com.example.ai_service.entity.dto.*;
import com.example.ai_service.prompts.ConstantPrompts;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import jakarta.mail.internet.MimeMessage;
import java.util.ArrayList;
import java.util.List;

@Service
public class ChatService {

    private final WebClient llmWebClient;
    private final WebClient authWebCLient;
    private final ConstantPrompts prompts;
    private final JavaMailSender mailSender;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final Logger logger = LoggerFactory.getLogger(ChatService.class);

    @Value("${spring.ai.openai.chat.options.model}")
    private String model;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public ChatService(
            @Qualifier("openAiWebClient") WebClient llmWebClient,
            @Qualifier("authWebClient") WebClient authWebCLient,
            ConstantPrompts prompts,
            JavaMailSender mailSender) {
        this.llmWebClient = llmWebClient;
        this.authWebCLient = authWebCLient;
        this.prompts = prompts;
        this.mailSender = mailSender;
    }

    public String chat(String message, String mode, String businessId, String authToken) {
        try {
            BusinessContextDTO businessContext = fetchBusinessContext(businessId, authToken);
            String busContext = buildBusinessContext(businessContext);
            String systemPrompt = buildSystemPrompt(mode, busContext);

            List<OpenAIChatRequest.Message> messages = new ArrayList<>();
            messages.add(new OpenAIChatRequest.Message("system", systemPrompt));
            messages.add(new OpenAIChatRequest.Message("user", message));

            // решаем: вообще разрешать ли функцию отправки письма
            boolean allowEmailTool = shouldEnableEmailTool(message);

            OpenAIChatRequest request = new OpenAIChatRequest();
            request.setModel(model);
            request.setMessages(messages);
            request.setTemperature(0.7);

            if (allowEmailTool) {
                // Описание функции send_email
                ObjectNode parameters = objectMapper.createObjectNode();
                parameters.put("type", "object");
                ObjectNode props = objectMapper.createObjectNode();
                props.set("to", jsonProp("string", "Email получателя"));
                props.set("subject", jsonProp("string", "Тема письма"));
                props.set("body", jsonProp("string", "Текст письма"));
                props.set("isHtml", jsonProp("boolean", "true — если HTML"));
                parameters.set("properties", props);

                ArrayNode required = objectMapper.createArrayNode();
                required.add("to");
                required.add("subject");
                required.add("body");
                parameters.set("required", required);

                OpenAIChatRequest.Function function = new OpenAIChatRequest.Function(
                        "send_email",
                        "Отправляет настоящее письмо на email. " +
                                "Вызывай только если пользователь явно просит написать и отправить письмо.",
                        parameters
                );

                OpenAIChatRequest.Tool tool = new OpenAIChatRequest.Tool("function", function);
                request.setTools(List.of(tool));
                request.setTool_choice("auto");
            } else {
                // никакой функции отправки почты для этого запроса
                request.setTools(null);
                request.setTool_choice("none");
            }

            logger.info("Sending request to LLM API with model: {}, allowEmailTool={}", model, allowEmailTool);

            OpenAIChatResponse response = llmWebClient.post()
                    .uri("/chat/completions")
                    .bodyValue(request)
                    .retrieve()
                    .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                            clientResponse -> clientResponse.bodyToMono(String.class)
                                    .flatMap(error -> {
                                        logger.error("LLM API error: {}", error);
                                        return Mono.error(new RuntimeException("LLM API error: " + error));
                                    }))
                    .bodyToMono(OpenAIChatResponse.class)
                    .block();

            if (response == null || response.getChoices() == null || response.getChoices().isEmpty()) {
                return "Не удалось получить ответ от модели.";
            }

            var choice = response.getChoices().get(0);
            var msg = choice.getMessage();

            // Проверка на tool call (сработает только если allowEmailTool = true)
            if (msg.getTool_calls() != null && !msg.getTool_calls().isEmpty()) {
                var toolCall = msg.getTool_calls().get(0);
                if ("function".equals(toolCall.getType()) && "send_email".equals(toolCall.getFunction().getName())) {
                    return handleSendEmail(toolCall.getFunction().getArguments());
                }
            }

            return msg.getContent() != null ? msg.getContent() : "Готов помочь!";

        } catch (Exception e) {
            logger.error("Error in chat method", e);
            return "Произошла ошибка при обработке запроса: " + e.getMessage();
        }
    }


    private boolean shouldEnableEmailTool(String userMessage) {
        if (userMessage == null) return false;
        String lower = userMessage.toLowerCase();

        if (lower.contains("напиши и отправь письмо")) return true;
        if (lower.contains("напиши письмо и отправь")) return true;
        if (lower.contains("напиши и отправь e-mail")) return true;
        if (lower.contains("напиши и отправь email")) return true;

        return false;
    }

    private String handleSendEmail(String argumentsJson) {
        try {
            JsonNode args = objectMapper.readTree(argumentsJson);
            String to = args.get("to").asText();
            String subject = args.get("subject").asText();
            String body = args.get("body").asText();
            boolean isHtml = args.has("isHtml") && args.get("isHtml").asBoolean();

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, isHtml);
            mailSender.send(mimeMessage);

            return "Письмо успешно отправлено на " + to + "!";
        } catch (Exception e) {
            logger.error("Ошибка отправки письма", e);
            return "Ошибка: " + e.getMessage();
        }
    }

    private JsonNode jsonProp(String type, String description) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("type", type);
        node.put("description", description);
        return node;
    }

    private BusinessContextDTO fetchBusinessContext(String businessId, String token) {
        try {
            return authWebCLient.get()
                    .uri("/api/business/{businessId}", businessId)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .retrieve()
                    .bodyToMono(BusinessContextDTO.class)
                    .block();
        } catch (Exception e) {
            logger.error("Ошибка получения контекста", e);
            return null;
        }
    }

    private String buildBusinessContext(BusinessContextDTO ctx) {
        if (ctx == null) return "";
        String employees = ctx.employees().isEmpty() ? "Нет сотрудников" :
                ctx.employees().stream()
                        .map(e -> " - " + e.name() + " (" + e.position() + ", " + e.email() + ")")
                        .reduce((a, b) -> a + "\n" + b).orElse("");

        return """
                Контекст бизнеса:
                - ID: %s
                - Название: %s
                - Сфера: %s
                - Владелец: %s
                - Прибыль: %s
                - Сотрудники:
                %s
                """.formatted(ctx.businessId(), ctx.businessName(), ctx.area(), ctx.ownerName(), ctx.profit(), employees);
    }

    private String buildSystemPrompt(String mode, String busContext) {
        String base = switch (mode == null ? "" : mode) {
            case "copilot" -> prompts.getSystemPromptCop();
            default -> prompts.getDefaultPrompt();
        };
        return base + (busContext.isEmpty() ? "" : "\n\n" + busContext);
    }
}

package com.example.ai_service.entity.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OpenAIChatRequest {

    private String model;
    private List<Message> messages;
    private Double temperature;
    private List<Tool> tools;
    private String tool_choice = "auto";  // Добавьте это!

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Message {
        private String role;
        private String content;
        // Уберите tool_calls из запроса - они только в ответе
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Tool {
        private String type = "function";
        private Function function;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Function {
        private String name;
        private String description;
        private JsonNode parameters;
    }
}
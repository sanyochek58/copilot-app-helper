package com.example.ai_service.entity.dto;

import lombok.Data;

import java.util.List;

@Data
public class OpenAIChatResponse {
    private String id;
    private String object;
    private long created;
    private String model;
    private List<Choice> choices;

    @Data
    public static class Choice {
        private int index;
        private Message message;
        private String finish_reason;
    }

    @Data
    public static class Message {
        private String role;
        private String content;
    }
}
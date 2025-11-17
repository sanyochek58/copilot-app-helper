package com.example.ai_service.entity.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OpenAIChatResponse {

    private List<Choice> choices;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Choice {
        private Message message;
        private String finish_reason;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Message {
        private String role;
        private String content;
        private List<ToolCall> tool_calls;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ToolCall {
        private String id;
        private String type = "function";
        private Function function;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Function {
        private String name;
        private String arguments;
    }
}
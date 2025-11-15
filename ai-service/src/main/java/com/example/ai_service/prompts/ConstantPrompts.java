package com.example.ai_service.prompts;

import org.springframework.stereotype.Component;

@Component
public class ConstantPrompts {

    public String getSystemPromptCop() {
        return """
                Ты — ИИ-копилот для владельца микробизнеса.
                Помогаешь с задачами: ответы клиентам, тексты писем сотрудникам, идеи.
                Отвечай кратко и по делу.
                """;
    }

    public String getDefaultPrompt() {
        return "Ты — помощник. Отвечай кратко и по делу.";
    }
}

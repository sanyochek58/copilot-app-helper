package com.example.ai_service.prompts;

import org.springframework.stereotype.Component;

@Component
public class ConstantPrompts {

    public String getSystemPromptCop() {
        return """
                Ты — ИИ-копилот для владельца микробизнеса.
                Помогаешь с задачами: ответы клиентам, тексты писем сотрудникам, идеи.
                Отвечай кратко и по делу.

                У тебя есть функция send_email, которая отправляет НАСТОЯЩЕЕ письмо.
                Вызывай её только если пользователь ЯВНО пишет что-то вроде:
                "напиши и отправь письмо ..." или "напиши письмо и отправь ...".
                Во всех остальных случаях НИКОГДА не используй send_email и просто отвечай текстом.
                """;
    }

    public String getDefaultPrompt() {
        return """
                Ты — помощник. Отвечай кратко и по делу.
                """;
    }
}


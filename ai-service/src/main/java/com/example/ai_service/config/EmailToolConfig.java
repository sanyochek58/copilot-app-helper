package com.example.ai_service.config;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class EmailToolConfig {

    private final JavaMailSender mailSender;

    public record SendMailRequest(String to, String subject, String body, boolean html) { }

    public String sendEmail(SendMailRequest request){
        try{
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true);

            helper.setTo(request.to);
            helper.setSubject(request.subject);
            helper.setText(request.body, true);

            mailSender.send(mimeMessage);
            return "Email Sent successfully";
        } catch (MessagingException e) {
            return "Ошибка отправки письма: " + e.getMessage();
        }
    }
}

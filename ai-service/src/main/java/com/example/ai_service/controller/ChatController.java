package com.example.ai_service.controller;

import com.example.ai_service.entity.dto.Request_ChatDTO;
import com.example.ai_service.entity.dto.Response_ChatDTO;
import com.example.ai_service.services.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/chat")
    public ResponseEntity<Response_ChatDTO> chat(@Valid @RequestBody Request_ChatDTO request_ChatDTO,
                                                 @AuthenticationPrincipal Jwt jwt) {

        String businessId = jwt.getClaim("businessId");
        String authToken = jwt.getTokenValue();

        String reply = chatService.chat(
                request_ChatDTO.message(),
                request_ChatDTO.mode(),
                businessId,
                authToken
        );

        return ResponseEntity.ok(new Response_ChatDTO(reply));
    }


}

package com.somap.backend.controller;

import com.somap.backend.dto.ChatRequestDTO;
import com.somap.backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping
    public ResponseEntity<Map<String, String>> chat(@RequestBody ChatRequestDTO request) {
        String reply = chatService.generateResponse(request.getMessage(), request.getHistory());
        return ResponseEntity.ok(Map.of("message", reply));
    }
}

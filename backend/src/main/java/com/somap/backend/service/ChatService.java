package com.somap.backend.service;

import com.somap.backend.dto.ChatMessageDTO;
import java.util.List;

public interface ChatService {
    String generateResponse(String message, List<ChatMessageDTO> history);
}

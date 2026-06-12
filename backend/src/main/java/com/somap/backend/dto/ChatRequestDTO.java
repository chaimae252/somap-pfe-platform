package com.somap.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class ChatRequestDTO {
    private String message;
    private List<ChatMessageDTO> history;
}

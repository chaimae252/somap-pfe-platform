package com.somap.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ContactMessageResponseDTO {
    private Long id;
    private String name;
    private String email;
    private String subject;
    private String message;
    private Long userId;
    private LocalDateTime createdAt;
    private String status;
    private String adminReply;
    private Long adminId;
    private String adminNom;
}
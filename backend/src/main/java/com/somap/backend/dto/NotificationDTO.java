package com.somap.backend.dto;

import com.somap.backend.enums.NotificationType;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Date;

@Data
public class NotificationDTO {

    private Long id;

    private String titre;

    private String message;

    private LocalDateTime dateEnvoi;

    private boolean lu;

    private NotificationType type;

    private Long utilisateurId ;
}
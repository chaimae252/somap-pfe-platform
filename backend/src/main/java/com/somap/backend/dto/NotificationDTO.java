package com.somap.backend.dto;

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
    private Long utilisateurId ;
}
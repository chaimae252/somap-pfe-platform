package com.somap.backend.dto;

import lombok.Data;
import java.util.Date;

@Data
public class NotificationDTO {

    private Long id;

    private String titre;

    private String message;

    private Date dateEnvoi;

    private boolean lu;
}
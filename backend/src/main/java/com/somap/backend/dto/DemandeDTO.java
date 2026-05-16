package com.somap.backend.dto;

import com.somap.backend.enums.DemandeStatus;
import com.somap.backend.enums.Urgence;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

@Data
public class DemandeDTO {

    private Long id;
    private String objet;
    private String description;
    private DemandeStatus statut;
    private LocalDateTime dateCreation;
    private List<ImageDTO> images;
    private Urgence urgence;
    private Long clientId;
    private Long serviceId;

}

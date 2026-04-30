package com.somap.backend.dto;

import com.somap.backend.enums.ProjetStatus;
import lombok.Data;
import java.util.Date;

@Data
public class ProjetDTO {

    private Long id;
    private String titre;
    private String description;
    private ProjetStatus statut;
    private int progression;
    private Date dateDebut;
    private Date dateFin;

    private Long clientId;

}

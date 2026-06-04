package com.somap.backend.dto;

import com.somap.backend.enums.ProjetStatus;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Date;

@Data
public class ProjetDTO {

    private Long id;
    private String titre;
    private String description;
    private ProjetStatus statut;
    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;

    private Long clientId;
    private String clientNom;
    private Long demandeId;
    private String demandeObjet;
    private String demandeStatut;
    private String serviceTitre;
    
    private Long adminId;
    private String adminNom;
}

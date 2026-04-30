package com.somap.backend.mapper;

import com.somap.backend.dto.ProjetDTO;
import com.somap.backend.entity.Projet;

public class ProjetMapper {

    public static ProjetDTO toDTO(Projet projet) {
        if (projet == null) return null;

        ProjetDTO dto = new ProjetDTO();
        dto.setId(projet.getId());
        dto.setTitre(projet.getTitre());
        dto.setDescription(projet.getDescription());
        dto.setStatut(projet.getStatut());
        dto.setProgression(projet.getProgression());
        dto.setDateDebut(projet.getDateDebut());
        dto.setDateFin(projet.getDateFin());

        return dto;
    }

    public static Projet toEntity(ProjetDTO dto) {
        if (dto == null) return null;

        Projet projet = new Projet();
        projet.setId(dto.getId());
        projet.setTitre(dto.getTitre());
        projet.setDescription(dto.getDescription());
        projet.setStatut(dto.getStatut());
        projet.setProgression(dto.getProgression());
        projet.setDateDebut(dto.getDateDebut());
        projet.setDateFin(dto.getDateFin());

        return projet;
    }
}
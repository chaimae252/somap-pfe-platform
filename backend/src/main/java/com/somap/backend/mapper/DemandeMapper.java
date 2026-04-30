package com.somap.backend.mapper;

import com.somap.backend.dto.DemandeDTO;
import com.somap.backend.entity.Demande;

public class DemandeMapper {

    public static DemandeDTO toDTO(Demande demande) {
        if (demande == null) return null;

        DemandeDTO dto = new DemandeDTO();
        dto.setId(demande.getId());
        dto.setDescription(demande.getDescription());
        dto.setStatut(demande.getStatut());
        dto.setDateCreation(demande.getDateCreation());

        return dto;
    }

    public static Demande toEntity(DemandeDTO dto) {
        if (dto == null) return null;

        Demande demande = new Demande();
        demande.setId(dto.getId());
        demande.setDescription(dto.getDescription());
        demande.setStatut(dto.getStatut());
        demande.setDateCreation(dto.getDateCreation());

        return demande;
    }
}
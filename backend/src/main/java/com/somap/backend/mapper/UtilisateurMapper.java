package com.somap.backend.mapper;

import com.somap.backend.dto.UtilisateurDTO;
import com.somap.backend.entity.Utilisateur;

public class UtilisateurMapper {

    public static UtilisateurDTO toDTO(Utilisateur user) {
        if (user == null) return null;

        UtilisateurDTO dto = new UtilisateurDTO();
        dto.setId(user.getId());
        dto.setNom(user.getNom());
        dto.setEmail(user.getEmail());

        return dto;
    }

    public static Utilisateur toEntity(UtilisateurDTO dto) {
        if (dto == null) return null;

        Utilisateur user = new Utilisateur();
        user.setId(dto.getId());
        user.setNom(dto.getNom());
        user.setEmail(dto.getEmail());

        return user;
    }
}
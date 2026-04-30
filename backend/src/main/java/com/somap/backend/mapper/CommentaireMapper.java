package com.somap.backend.mapper;

import com.somap.backend.dto.CommentaireDTO;
import com.somap.backend.dto.ImageDTO;
import com.somap.backend.entity.Commentaire;
import com.somap.backend.entity.Image;

import java.util.stream.Collectors;

public class CommentaireMapper {

    public static CommentaireDTO toDTO(Commentaire c) {
        if (c == null) return null;

        CommentaireDTO dto = new CommentaireDTO();
        dto.setId(c.getId());
        dto.setContenu(c.getContenu());
        dto.setDateCommentaire(c.getDateCommentaire());

        // 🔥 FIX: list of images
        if (c.getImages() != null) {
            dto.setImages(
                    c.getImages()
                            .stream()
                            .map(CommentaireMapper::imageToDTO)
                            .collect(Collectors.toList())
            );
        }

        return dto;
    }

    public static Commentaire toEntity(CommentaireDTO dto) {
        if (dto == null) return null;

        Commentaire c = new Commentaire();
        c.setId(dto.getId());
        c.setContenu(dto.getContenu());
        c.setDateCommentaire(dto.getDateCommentaire());

        // 🔥 optional reverse mapping
        if (dto.getImages() != null) {
            c.setImages(
                    dto.getImages()
                            .stream()
                            .map(CommentaireMapper::imageToEntity)
                            .collect(Collectors.toList())
            );
        }

        return c;
    }

    // ======================
    // IMAGE MAPPING
    // ======================

    private static ImageDTO imageToDTO(Image image) {
        if (image == null) return null;

        ImageDTO dto = new ImageDTO();
        dto.setId(image.getId());
        dto.setImageUrl(image.getImageUrl());

        return dto;
    }

    private static Image imageToEntity(ImageDTO dto) {
        if (dto == null) return null;

        Image image = new Image();
        image.setId(dto.getId());
        image.setImageUrl(dto.getImageUrl());

        return image;
    }
}
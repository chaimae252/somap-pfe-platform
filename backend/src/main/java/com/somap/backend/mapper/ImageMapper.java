package com.somap.backend.mapper;

import com.somap.backend.dto.ImageDTO;
import com.somap.backend.entity.Image;

public class ImageMapper {

    public static ImageDTO toDTO(Image image) {
        if (image == null) return null;

        ImageDTO dto = new ImageDTO();
        dto.setId(image.getId());
        dto.setImageUrl(image.getImageUrl());

        return dto;
    }

    public static Image toEntity(ImageDTO dto) {
        if (dto == null) return null;

        Image image = new Image();
        image.setId(dto.getId());
        image.setImageUrl(dto.getImageUrl());

        return image;
    }
}
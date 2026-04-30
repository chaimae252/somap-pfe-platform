package com.somap.backend.mapper;

import com.somap.backend.dto.ServiceDTO;
import com.somap.backend.dto.ImageDTO;
import com.somap.backend.entity.Service;
import com.somap.backend.entity.Image;

import java.util.List;
import java.util.stream.Collectors;

public class ServiceMapper {

    public static ServiceDTO toDTO(Service service) {
        if (service == null) return null;

        ServiceDTO dto = new ServiceDTO();
        dto.setId(service.getId());
        dto.setTitre(service.getTitre());
        dto.setDescription(service.getDescription());

        // 🔥 FIX: list of images
        if (service.getImages() != null) {
            dto.setImages(
                    service.getImages()
                            .stream()
                            .map(ServiceMapper::imageToDTO)
                            .collect(Collectors.toList())
            );
        }

        return dto;
    }

    public static Service toEntity(ServiceDTO dto) {
        if (dto == null) return null;

        Service service = new Service();
        service.setId(dto.getId());
        service.setTitre(dto.getTitre());
        service.setDescription(dto.getDescription());

        // 🔥 optional: images mapping if needed
        if (dto.getImages() != null) {
            service.setImages(
                    dto.getImages()
                            .stream()
                            .map(ServiceMapper::imageToEntity)
                            .collect(Collectors.toList())
            );
        }

        return service;
    }

    // =======================
    // IMAGE MAPPING (LOCAL)
    // =======================

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
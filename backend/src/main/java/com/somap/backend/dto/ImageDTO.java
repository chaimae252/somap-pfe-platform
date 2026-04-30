package com.somap.backend.dto;

import lombok.Data;

@Data
public class ImageDTO {

    private Long id;

    private String imageUrl;

    private Long commentaireId;

    private Long demandeId;

    private Long serviceId;
}
package com.somap.backend.dto;

import lombok.Data;

import java.util.List;

@Data
public class ServiceDTO {

    private Long id;
    private String titre;
    private String description;
    private List<ImageDTO> images;
}

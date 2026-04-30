package com.somap.backend.dto;

import lombok.Data;

import java.util.Date;
import java.util.List;

@Data
public class DemandeDTO {

    private Long id;
    private String description;
    private String statut;
    private Date dateCreation;
    private List<ImageDTO> images;

    private Long clientId;
    private Long serviceId;

}

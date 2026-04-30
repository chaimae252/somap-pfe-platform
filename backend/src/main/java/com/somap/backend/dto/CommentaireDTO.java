package com.somap.backend.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

@Data
public class CommentaireDTO {

    private Long id;
    private String contenu;
    private List<ImageDTO> images;
    private LocalDateTime dateCommentaire;

    private Long clientId;
    private Long serviceId;

}

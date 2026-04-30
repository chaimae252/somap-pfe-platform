package com.somap.backend.dto;

import lombok.Data;
import java.util.Date;
import java.util.List;

@Data
public class CommentaireDTO {

    private Long id;
    private String contenu;
    private List<ImageDTO> images;
    private Date dateCommentaire;

    private Long clientId;
    private Long serviceId;

}

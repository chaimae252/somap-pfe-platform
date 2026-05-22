package com.somap.backend.service;

import com.somap.backend.dto.CommentaireDTO;

import java.util.List;

public interface CommentaireService {

    CommentaireDTO createCommentaire(CommentaireDTO commentaireDTO);

    List<CommentaireDTO> getAllCommentaires();

    List<CommentaireDTO> getCommentairesByService(Long serviceId);

    CommentaireDTO getCommentaireById(Long id);

    CommentaireDTO updateCommentaire(Long id, CommentaireDTO commentaireDTO);

    void deleteCommentaire(Long id);
}

package com.somap.backend.service;

import com.somap.backend.dto.CommentaireDTO;

import java.util.List;

public interface CommentaireService {

    CommentaireDTO createCommentaire(CommentaireDTO commentaireDTO);

    List<CommentaireDTO> getAllCommentaires();

    CommentaireDTO getCommentaireById(Long id);

    void deleteCommentaire(Long id);
}
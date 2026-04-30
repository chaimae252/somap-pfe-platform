package com.somap.backend.controller;

import com.somap.backend.dto.CommentaireDTO;
import com.somap.backend.service.CommentaireService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/commentaires")
@RequiredArgsConstructor
public class CommentaireController {

    private final CommentaireService commentaireService;

    @PostMapping
    public ResponseEntity<CommentaireDTO> createCommentaire(
            @RequestBody CommentaireDTO commentaireDTO
    ) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(commentaireService.createCommentaire(commentaireDTO));
    }

    @GetMapping
    public ResponseEntity<List<CommentaireDTO>> getAllCommentaires() {

        return ResponseEntity.ok(
                commentaireService.getAllCommentaires()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<CommentaireDTO> getCommentaireById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                commentaireService.getCommentaireById(id)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteCommentaire(
            @PathVariable Long id
    ) {

        commentaireService.deleteCommentaire(id);

        return ResponseEntity.ok("Commentaire supprimé avec succès");
    }
}
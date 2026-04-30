package com.somap.backend.controller;

import com.somap.backend.dto.ProjetDTO;
import com.somap.backend.service.ProjetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projets")
@RequiredArgsConstructor
public class ProjetController {

    private final ProjetService projetService;

    @PostMapping
    public ResponseEntity<ProjetDTO> createProjet(
            @RequestBody ProjetDTO projetDTO
    ) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projetService.createProjet(projetDTO));
    }

    @GetMapping
    public ResponseEntity<List<ProjetDTO>> getAllProjects() {

        return ResponseEntity.ok(
                projetService.getAllProjects()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjetDTO> getProjetById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                projetService.getProjetById(id)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjetDTO> updateProjet(
            @PathVariable Long id,
            @RequestBody ProjetDTO projetDTO
    ) {

        return ResponseEntity.ok(
                projetService.updateProjet(id, projetDTO)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteProjet(
            @PathVariable Long id
    ) {

        projetService.deleteProjet(id);

        return ResponseEntity.ok("Projet supprimé avec succès");
    }
}
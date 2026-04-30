package com.somap.backend.controller;

import com.somap.backend.dto.UtilisateurDTO;
import com.somap.backend.service.UtilisateurService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UtilisateurController {

    private final UtilisateurService utilisateurService;

    @GetMapping
    public ResponseEntity<List<UtilisateurDTO>> getAllUsers() {

        return ResponseEntity.ok(
                utilisateurService.getAllUsers()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<UtilisateurDTO> getUserById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                utilisateurService.getUserById(id)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteUser(
            @PathVariable Long id
    ) {

        utilisateurService.deleteUser(id);

        return ResponseEntity.ok("Utilisateur supprimé avec succès");
    }
}
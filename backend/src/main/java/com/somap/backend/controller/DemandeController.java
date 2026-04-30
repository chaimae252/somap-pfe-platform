package com.somap.backend.controller;

import com.somap.backend.dto.DemandeDTO;
import com.somap.backend.service.DemandeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/demandes")
@RequiredArgsConstructor
public class DemandeController {

    private final DemandeService demandeService;

    @PostMapping
    public ResponseEntity<DemandeDTO> createDemande(
            @RequestBody DemandeDTO demandeDTO
    ) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(demandeService.createDemande(demandeDTO));
    }

    @GetMapping
    public ResponseEntity<List<DemandeDTO>> getAllDemandes() {

        return ResponseEntity.ok(
                demandeService.getAllDemandes()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<DemandeDTO> getDemandeById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                demandeService.getDemandeById(id)
        );
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<DemandeDTO> updateDemandeStatus(
            @PathVariable Long id,
            @RequestParam String status
    ) {

        return ResponseEntity.ok(
                demandeService.updateDemandeStatus(id, status)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteDemande(
            @PathVariable Long id
    ) {

        demandeService.deleteDemande(id);

        return ResponseEntity.ok("Demande supprimée avec succès");
    }
}
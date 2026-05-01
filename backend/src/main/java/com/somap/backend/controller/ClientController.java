package com.somap.backend.controller;

import com.somap.backend.dto.ClientDTO;
import com.somap.backend.service.ClientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clients")
@RequiredArgsConstructor
public class ClientController {

    private final ClientService clientService;

    @GetMapping
    public ResponseEntity<List<ClientDTO>> getAllClients() {

        return ResponseEntity.ok(
                clientService.getAllClients()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClientDTO> getClientById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                clientService.getClientById(id)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClientDTO> updateClient(
            @PathVariable Long id,
            @RequestBody ClientDTO clientDTO
    ) {

        return ResponseEntity.ok(
                clientService.updateClient(id, clientDTO)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteClient(
            @PathVariable Long id
    ) {

        clientService.deleteClient(id);

        return ResponseEntity.ok("Client supprimé avec succès");
    }
}
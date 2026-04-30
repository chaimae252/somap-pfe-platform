package com.somap.backend.controller;

import com.somap.backend.dto.ServiceDTO;
import com.somap.backend.service.ServiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
public class ServiceController {

    private final ServiceService serviceService;

    @PostMapping
    public ResponseEntity<ServiceDTO> createService(
            @RequestBody ServiceDTO serviceDTO
    ) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(serviceService.createService(serviceDTO));
    }

    @GetMapping
    public ResponseEntity<List<ServiceDTO>> getAllServices() {

        return ResponseEntity.ok(
                serviceService.getAllServices()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServiceDTO> getServiceById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                serviceService.getServiceById(id)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ServiceDTO> updateService(
            @PathVariable Long id,
            @RequestBody ServiceDTO serviceDTO
    ) {

        return ResponseEntity.ok(
                serviceService.updateService(id, serviceDTO)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteService(
            @PathVariable Long id
    ) {

        serviceService.deleteService(id);

        return ResponseEntity.ok("Service supprimé avec succès");
    }
}
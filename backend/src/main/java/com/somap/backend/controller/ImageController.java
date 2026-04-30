package com.somap.backend.controller;

import com.somap.backend.dto.ImageDTO;
import com.somap.backend.service.ImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
public class ImageController {

    private final ImageService imageService;

    @PostMapping
    public ResponseEntity<ImageDTO> uploadImage(
            @RequestBody ImageDTO imageDTO
    ) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(imageService.uploadImage(imageDTO));
    }

    @GetMapping
    public ResponseEntity<List<ImageDTO>> getAllImages() {

        return ResponseEntity.ok(
                imageService.getAllImages()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ImageDTO> getImageById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                imageService.getImageById(id)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteImage(
            @PathVariable Long id
    ) {

        imageService.deleteImage(id);

        return ResponseEntity.ok("Image supprimée avec succès");
    }
}
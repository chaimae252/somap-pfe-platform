package com.somap.backend.controller;

import com.somap.backend.dto.ImageDTO;
import com.somap.backend.service.ImageService;
import com.somap.backend.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
public class ImageController {

    private final ImageService imageService;
    private final CloudinaryService cloudinaryService;

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
    
    @PostMapping("/upload")
    public ResponseEntity<ImageDTO> uploadFile(
       @RequestParam("file") MultipartFile file,
       @RequestParam(value = "demandeId", required = false) Long demandeId,
       @RequestParam(value = "commentaireId", required = false) Long commentaireId,
       @RequestParam(value = "serviceId", required = false) Long serviceId) throws IOException {

    String fileUrl = cloudinaryService.uploadFile(file);

    ImageDTO dto = new ImageDTO();
    dto.setImageUrl(fileUrl);
    dto.setDemandeId(demandeId);
    dto.setCommentaireId(commentaireId);
    dto.setServiceId(serviceId);

    return ResponseEntity.ok(imageService.uploadImage(dto));
}
@GetMapping("/demande/{demandeId}")
public ResponseEntity<List<ImageDTO>> getImagesByDemande(@PathVariable Long demandeId) {
    return ResponseEntity.ok(imageService.getImagesByDemande(demandeId));
}
}

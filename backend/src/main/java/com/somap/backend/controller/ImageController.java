package com.somap.backend.controller;

import com.somap.backend.dto.ImageDTO;
import com.somap.backend.service.ImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.util.List;
import java.io.IOException;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
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
    
    @PostMapping("/upload")
    public ResponseEntity<ImageDTO> uploadFile(
       @RequestParam("file") MultipartFile file,
       @RequestParam("demandeId") Long demandeId) throws IOException {
    String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
    String uploadDir = "uploads/";
    Path uploadPath = Paths.get(uploadDir);
    if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);

    Path filePath = uploadPath.resolve(fileName);
    Files.write(filePath, file.getBytes());

    String fileUrl = "/uploads/" + fileName;  // serve statically later

    ImageDTO dto = new ImageDTO();
    dto.setImageUrl(fileUrl);
    dto.setDemandeId(demandeId);

    return ResponseEntity.ok(imageService.uploadImage(dto));
}
}
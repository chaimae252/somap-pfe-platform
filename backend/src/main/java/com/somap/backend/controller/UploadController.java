package com.somap.backend.controller;

import com.somap.backend.dto.ImageDTO;
import com.somap.backend.service.ImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UploadController {

    private final ImageService imageService;

    @PostMapping("/upload")
    public ResponseEntity<ImageDTO> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "demandeId", required = false) Long demandeId,
            @RequestParam(value = "commentaireId", required = false) Long commentaireId
    ) throws IOException {
        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path uploadPath = Paths.get("uploads/");

        System.out.println("UPLOAD COMMENTAIRE: file=" + fileName
                + ", commentaireId=" + commentaireId
                + ", demandeId=" + demandeId);

        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        Path filePath = uploadPath.resolve(fileName);
        Files.write(filePath, file.getBytes());

        ImageDTO dto = new ImageDTO();
        dto.setImageUrl("/uploads/" + fileName);
        dto.setDemandeId(demandeId);
        dto.setCommentaireId(commentaireId);

        return ResponseEntity.ok(imageService.uploadImage(dto));
    }
}

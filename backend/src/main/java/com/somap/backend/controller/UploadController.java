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

import com.somap.backend.service.CloudinaryService;
import java.io.IOException;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UploadController {

    private final ImageService imageService;
    private final CloudinaryService cloudinaryService;

    @PostMapping("/upload")
    public ResponseEntity<ImageDTO> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "demandeId", required = false) Long demandeId,
            @RequestParam(value = "commentaireId", required = false) Long commentaireId
    ) throws IOException {
        String imageUrl = cloudinaryService.uploadFile(file);

        ImageDTO dto = new ImageDTO();
        dto.setImageUrl(imageUrl);
        dto.setDemandeId(demandeId);
        dto.setCommentaireId(commentaireId);

        return ResponseEntity.ok(imageService.uploadImage(dto));
    }
}

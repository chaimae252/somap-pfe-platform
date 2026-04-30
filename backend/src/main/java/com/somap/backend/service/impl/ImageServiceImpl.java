package com.somap.backend.service.impl;

import com.somap.backend.dto.ImageDTO;
import com.somap.backend.entity.Commentaire;
import com.somap.backend.entity.Demande;
import com.somap.backend.entity.Image;
import com.somap.backend.entity.Service;
import com.somap.backend.exception.ResourceNotFoundException;
import com.somap.backend.repository.CommentaireRepository;
import com.somap.backend.repository.DemandeRepository;
import com.somap.backend.repository.ImageRepository;
import com.somap.backend.repository.ServiceRepository;
import com.somap.backend.service.ImageService;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.stream.Collectors;

@org.springframework.stereotype.Service
@RequiredArgsConstructor
public class ImageServiceImpl implements ImageService {

    private final ImageRepository imageRepository;
    private final CommentaireRepository commentaireRepository;
    private final DemandeRepository demandeRepository;
    private final ServiceRepository serviceRepository;

    @Override
    public ImageDTO uploadImage(ImageDTO imageDTO) {

        Image image = new Image();

        image.setImageUrl(imageDTO.getImageUrl());

        // 🔗 Commentaire
        if (imageDTO.getCommentaireId() != null) {

            Commentaire commentaire = commentaireRepository.findById(
                    imageDTO.getCommentaireId()
            ).orElseThrow(() ->
                    new ResourceNotFoundException("Commentaire introuvable")
            );

            image.setCommentaire(commentaire);
        }

        // 🔗 Demande
        if (imageDTO.getDemandeId() != null) {

            Demande demande = demandeRepository.findById(
                    imageDTO.getDemandeId()
            ).orElseThrow(() ->
                    new ResourceNotFoundException("Demande introuvable")
            );

            image.setDemande(demande);
        }

        // 🔗 Service
        if (imageDTO.getServiceId() != null) {

            Service service = serviceRepository.findById(
                    imageDTO.getServiceId()
            ).orElseThrow(() ->
                    new ResourceNotFoundException("Service introuvable")
            );

            image.setService(service);
        }

        Image savedImage = imageRepository.save(image);

        return mapToDTO(savedImage);
    }

    @Override
    public List<ImageDTO> getAllImages() {

        return imageRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public ImageDTO getImageById(Long id) {

        Image image = imageRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Image introuvable")
                );

        return mapToDTO(image);
    }

    @Override
    public void deleteImage(Long id) {

        Image image = imageRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Image introuvable")
                );

        imageRepository.delete(image);
    }

    // =========================
    // MAPPER
    // =========================

    private ImageDTO mapToDTO(Image image) {

        ImageDTO dto = new ImageDTO();

        dto.setId(image.getId());
        dto.setImageUrl(image.getImageUrl());

        if (image.getCommentaire() != null) {
            dto.setCommentaireId(image.getCommentaire().getId());
        }

        if (image.getDemande() != null) {
            dto.setDemandeId(image.getDemande().getId());
        }

        if (image.getService() != null) {
            dto.setServiceId(image.getService().getId());
        }

        return dto;
    }
}
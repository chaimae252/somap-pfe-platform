package com.somap.backend.service.impl;

import com.somap.backend.dto.CommentaireDTO;
import com.somap.backend.dto.ImageDTO;
import com.somap.backend.entity.Client;
import com.somap.backend.entity.Commentaire;
import com.somap.backend.entity.Image;
import com.somap.backend.enums.NotificationType;
import com.somap.backend.repository.ClientRepository;
import com.somap.backend.repository.CommentaireRepository;
import com.somap.backend.repository.ServiceRepository;
import com.somap.backend.service.CommentaireService;
import com.somap.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@org.springframework.stereotype.Service
@RequiredArgsConstructor
public class CommentaireServiceImpl implements CommentaireService {

    private final CommentaireRepository commentaireRepository;
    private final ClientRepository clientRepository;
    private final ServiceRepository serviceRepository;
    private final NotificationService notificationService;

    @Override
    public CommentaireDTO createCommentaire(CommentaireDTO dto) {

        Client client = clientRepository.findById(dto.getClientId())
                .orElseThrow(() -> new RuntimeException("Client introuvable"));

        com.somap.backend.entity.Service service = serviceRepository.findById(dto.getServiceId())
                .orElseThrow(() -> new RuntimeException("Service introuvable"));

        Commentaire commentaire = new Commentaire();
        commentaire.setContenu(dto.getContenu());
        commentaire.setClient(client);
        commentaire.setService(service);
        commentaire.setDateCommentaire(
                dto.getDateCommentaire() != null ? dto.getDateCommentaire() : LocalDateTime.now()
        );

        // ✅ FIX: parent comment handling
        Commentaire parent = null;
        if (dto.getParentId() != null) {
            parent = commentaireRepository.findById(dto.getParentId())
                    .orElseThrow(() -> new RuntimeException("Commentaire parent introuvable"));

            commentaire.setParent(parent);
        }

        Commentaire saved = commentaireRepository.save(commentaire);

        if (parent != null && parent.getClient() != null
                && !parent.getClient().getId().equals(client.getId())) {
            try {
                notificationService.notifyUser(
                        parent.getClient().getId(),
                        "Nouvelle réponse à votre commentaire",
                        client.getNom() + " a répondu à votre commentaire sur " + service.getTitre() + ".",
                        NotificationType.COMMENTAIRE,
                        "SERVICE",
                        service.getId()
                );
            } catch (Exception e) {
                System.out.println("Notification commentaire reply error: " + e.getMessage());
            }
        }

        return mapToDTO(saved);
    }

    @Override
    public List<CommentaireDTO> getAllCommentaires() {
        return commentaireRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<CommentaireDTO> getCommentairesByService(Long serviceId) {
        return commentaireRepository.findByServiceIdAndParentIsNull(serviceId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public CommentaireDTO getCommentaireById(Long id) {
        Commentaire commentaire = commentaireRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commentaire introuvable"));

        return mapToDTO(commentaire);
    }

    @Override
    public CommentaireDTO updateCommentaire(Long id, CommentaireDTO dto) {
        Commentaire commentaire = commentaireRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commentaire introuvable"));

        commentaire.setContenu(dto.getContenu());

        Commentaire saved = commentaireRepository.save(commentaire);
        return mapToDTO(saved);
    }

    @Override
    public void deleteCommentaire(Long id) {
        Commentaire commentaire = commentaireRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commentaire introuvable"));

        commentaireRepository.delete(commentaire);
    }

    // =========================
    // MAPPING
    // =========================

    private CommentaireDTO mapToDTO(Commentaire commentaire) {

        CommentaireDTO dto = new CommentaireDTO();

        dto.setId(commentaire.getId());
        dto.setContenu(commentaire.getContenu());
        dto.setDateCommentaire(commentaire.getDateCommentaire());

        // client
        if (commentaire.getClient() != null) {
            dto.setClientId(commentaire.getClient().getId());
            dto.setClientNom(commentaire.getClient().getNom());
        }

        // service
        if (commentaire.getService() != null) {
            dto.setServiceId(commentaire.getService().getId());
        }

        // images
        if (commentaire.getImages() != null) {
            dto.setImages(
                    commentaire.getImages()
                            .stream()
                            .map(this::mapImageToDTO)
                            .collect(Collectors.toList())
            );
        }

        // parent id
        if (commentaire.getParent() != null) {
            dto.setParentId(commentaire.getParent().getId());
        }

        // replies (🔥 recursive mapping)
        if (commentaire.getReplies() != null) {
            dto.setReplies(
                    commentaire.getReplies()
                            .stream()
                            .map(this::mapToDTO)
                            .collect(Collectors.toList())
            );
        }

        return dto;
    }

    private ImageDTO mapImageToDTO(Image image) {

        ImageDTO dto = new ImageDTO();
        dto.setId(image.getId());
        dto.setImageUrl(image.getImageUrl());

        if (image.getCommentaire() != null) {
            dto.setCommentaireId(image.getCommentaire().getId());
        }

        return dto;
    }
}

package com.somap.backend.service.impl;

import com.somap.backend.dto.CommentaireDTO;
import com.somap.backend.dto.ImageDTO;
import com.somap.backend.entity.Admin;
import com.somap.backend.entity.Client;
import com.somap.backend.entity.Commentaire;
import com.somap.backend.entity.Image;
import com.somap.backend.enums.NotificationType;
import com.somap.backend.repository.AdminRepository;
import com.somap.backend.repository.ClientRepository;
import com.somap.backend.repository.CommentaireRepository;
import com.somap.backend.repository.ServiceRepository;
import com.somap.backend.service.CommentaireService;
import com.somap.backend.service.NotificationService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
    private final AdminRepository adminRepository;

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

        System.out.println("[COMMENT DEBUG] createCommentaire: dto.parentId=" + dto.getParentId() + ", clientId=" + dto.getClientId());

        // ✅ FIX: parent comment handling
        Commentaire parent = null;
        if (dto.getParentId() != null) {
            parent = commentaireRepository.findById(dto.getParentId())
                    .orElseThrow(() -> new RuntimeException("Commentaire parent introuvable"));
            System.out.println("[COMMENT DEBUG] Found parent comment id=" + parent.getId() + ", parentOwner=" + (parent.getClient() != null ? parent.getClient().getId() : "null"));
            commentaire.setParent(parent);
        }

        Commentaire saved = commentaireRepository.save(commentaire);
        System.out.println("[COMMENT DEBUG] Saved comment id=" + saved.getId());

        // Notify admins about the new comment
        try {
            String title = "Nouveau commentaire";
            String msg = String.format("Nouveau commentaire sur le service '%s'.", service.getTitre());
            
            notificationService.notifyAdmins(
                    title,
                    msg,
                    NotificationType.COMMENTAIRE,
                    "COMMENTAIRE",
                    saved.getId()
            );
            System.out.println("[COMMENT DEBUG] Admin notification triggered for comment: " + saved.getId() + " on service: " + service.getTitre());
        } catch (Exception e) {
            System.out.println("[COMMENT DEBUG] Admin notification failed: " + e.getMessage());
            e.printStackTrace();
        }

        if (parent != null) {
            if (parent.getClient() == null) {
                System.out.println("[COMMENT DEBUG] Parent owner client is null!");
            } else {
                System.out.println("[COMMENT DEBUG] Comparing owner=" + parent.getClient().getId() + " with replier=" + client.getId());
                if (!parent.getClient().getId().equals(client.getId())) {
                    System.out.println("[COMMENT DEBUG] Triggering notification to user=" + parent.getClient().getId());
                    try {
                        notificationService.notifyUser(
                                parent.getClient().getId(),
                                "Nouvelle réponse à votre commentaire",
                                client.getNom() + " a répondu à votre commentaire sur " + service.getTitre() + ".",
                                NotificationType.COMMENTAIRE,
                                "SERVICE",
                                service.getId()
                        );
                        System.out.println("[COMMENT DEBUG] Notification triggered successfully!");
                    } catch (Exception e) {
                        System.out.println("[COMMENT DEBUG] Notification failed: " + e.getMessage());
                        e.printStackTrace();
                    }
                } else {
                    System.out.println("[COMMENT DEBUG] Owner and replier are the same, skipping notification.");
                }
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

        // 1. Resolve current admin name
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Admin currentAdmin = null;
        String adminName = "Un administrateur";
        if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
            String email = auth.getName();
            currentAdmin = adminRepository.findByEmail(email).orElse(null);
            if (currentAdmin != null) {
                adminName = currentAdmin.getNom();
            }
        }

        // 2. Notify the client who wrote the comment
        if (commentaire.getClient() != null) {
            String serviceTitre = commentaire.getService() != null ? commentaire.getService().getTitre() : "un service";
            try {
                notificationService.notifyUser(
                        commentaire.getClient().getId(),
                        "Commentaire retiré",
                        "Votre commentaire sur le service '" + serviceTitre + "' a été supprimé car il ne respecte pas nos conditions d'utilisation (contenu offensant, spam ou non conforme).",
                        NotificationType.COMMENTAIRE
                );
            } catch (Exception e) {
                System.out.println("[DELETE COMMENT] Client notification failed: " + e.getMessage());
            }
        }

        // 3. Notify other admins
        String clientName = commentaire.getClient() != null ? commentaire.getClient().getNom() : "Client anonyme";
        String serviceName = commentaire.getService() != null ? commentaire.getService().getTitre() : "un service";
        String commentContent = commentaire.getContenu();
        if (commentContent != null && commentContent.length() > 30) {
            commentContent = commentContent.substring(0, 27) + "...";
        }
        
        String notifTitle = "Commentaire supprimé";
        String notifMsg = String.format("L'administrateur %s a supprimé le commentaire de %s sur le service '%s' (Contenu: '%s').",
                adminName, clientName, serviceName, commentContent);

        try {
            List<Admin> admins = adminRepository.findAll();
            for (Admin admin : admins) {
                if (currentAdmin == null || !admin.getId().equals(currentAdmin.getId())) {
                    notificationService.notifyUser(
                            admin.getId(),
                            notifTitle,
                            notifMsg,
                            NotificationType.COMMENTAIRE
                    );
                }
            }
        } catch (Exception e) {
            System.out.println("[DELETE COMMENT] Other admins notification failed: " + e.getMessage());
        }

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

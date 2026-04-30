package com.somap.backend.service.impl;

import com.somap.backend.dto.NotificationDTO;
import com.somap.backend.entity.Notification;
import com.somap.backend.entity.Utilisateur;
import com.somap.backend.repository.NotificationRepository;
import com.somap.backend.repository.UtilisateurRepository;
import com.somap.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UtilisateurRepository utilisateurRepository;

    // =========================
    // CREATE NOTIFICATION
    // =========================
    @Override
    public NotificationDTO createNotification(NotificationDTO dto) {

        Utilisateur user = utilisateurRepository.findById(dto.getUtilisateurId())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        Notification notification = new Notification();
        notification.setTitre(dto.getTitre());
        notification.setMessage(dto.getMessage());
        notification.setDateEnvoi(dto.getDateEnvoi());
        notification.setLu(false);
        notification.setUtilisateur(user);

        Notification saved = notificationRepository.save(notification);

        return mapToDTO(saved);
    }

    // =========================
    // GET ALL
    // =========================
    @Override
    public List<NotificationDTO> getAllNotifications() {

        return notificationRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // =========================
    // GET BY ID
    // =========================
    @Override
    public NotificationDTO getNotificationById(Long id) {

        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification introuvable"));

        return mapToDTO(notification);
    }

    // =========================
    // MARK AS READ
    // =========================
    @Override
    public void markAsRead(Long id) {

        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification introuvable"));

        notification.setLu(true);
        notificationRepository.save(notification);
    }

    // =========================
    // DELETE
    // =========================
    @Override
    public void deleteNotification(Long id) {

        notificationRepository.deleteById(id);
    }

    // =========================
    // MAPPER
    // =========================
    private NotificationDTO mapToDTO(Notification n) {

        NotificationDTO dto = new NotificationDTO();
        dto.setId(n.getId());
        dto.setTitre(n.getTitre());
        dto.setMessage(n.getMessage());
        dto.setDateEnvoi(n.getDateEnvoi());
        dto.setLu(n.isLu());
        dto.setUtilisateurId(n.getUtilisateur().getId());

        return dto;
    }
}
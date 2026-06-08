package com.somap.backend.service.impl;

import com.somap.backend.dto.NotificationDTO;
import com.somap.backend.entity.Admin;
import com.somap.backend.entity.Notification;
import com.somap.backend.entity.Utilisateur;
import com.somap.backend.enums.NotificationType;
import com.somap.backend.repository.AdminRepository;
import com.somap.backend.repository.ClientRepository;
import com.somap.backend.repository.NotificationRepository;
import com.somap.backend.repository.UtilisateurRepository;
import com.somap.backend.service.ExpoNotificationService;
import com.somap.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final AdminRepository adminRepository;
    private final ClientRepository clientRepository;
    private final ExpoNotificationService expoNotificationService;

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
        notification.setDateEnvoi(dto.getDateEnvoi() != null ? dto.getDateEnvoi() : LocalDateTime.now());
        notification.setLu(false);
        notification.setUtilisateur(user);

        // 🔥 THIS WAS MISSING
        notification.setType(dto.getType() != null ? dto.getType() : NotificationType.SYSTEME);
        notification.setTargetType(dto.getTargetType());
        notification.setTargetId(dto.getTargetId());

        Notification saved = notificationRepository.save(notification);

        try {
            clientRepository.findById(user.getId()).ifPresent(client -> {
                if (client.getPushToken() != null && !client.getPushToken().trim().isEmpty()) {
                    java.util.Map<String, Object> data = new java.util.HashMap<>();
                    if (saved.getTargetType() != null) {
                        data.put("targetType", saved.getTargetType().toString());
                    }
                    if (saved.getTargetId() != null) {
                        data.put("targetId", saved.getTargetId().toString());
                    }
                    expoNotificationService.sendPushNotification(
                            client.getPushToken(),
                            saved.getTitre(),
                            saved.getMessage(),
                            data
                    );
                }
            });
        } catch (Exception e) {
            // ignore
        }

        return mapToDTO(saved);
    }

    @Override
    public NotificationDTO notifyUser(Long utilisateurId, String titre, String message, NotificationType type) {
        return notifyUser(utilisateurId, titre, message, type, null, null);
    }

    @Override
    public NotificationDTO notifyUser(
            Long utilisateurId,
            String titre,
            String message,
            NotificationType type,
            String targetType,
            Long targetId
    ) {
        NotificationDTO dto = new NotificationDTO();
        dto.setUtilisateurId(utilisateurId);
        dto.setTitre(titre);
        dto.setMessage(message);
        dto.setType(type);
        dto.setDateEnvoi(LocalDateTime.now());
        dto.setTargetType(targetType);
        dto.setTargetId(targetId);

        return createNotification(dto);
    }

    @Override
    public void notifyAdmins(String titre, String message, NotificationType type, String targetType, Long targetId) {
        List<Admin> admins = adminRepository.findAll();

        for (Admin admin : admins) {
            notifyUser(admin.getId(), titre, message, type, targetType, targetId);
        }
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

    @Override
    public List<NotificationDTO> getNotificationsByClient(Long userId) {
        return notificationRepository
                .findByUtilisateurIdOrderByDateEnvoiDesc(userId)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Override
    public long countUnreadByUser(Long userId) {
        return notificationRepository.countByUtilisateurIdAndLuFalse(userId);
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

        // 💥 ADD THIS
        dto.setType(n.getType());
        dto.setTargetType(n.getTargetType());
        dto.setTargetId(n.getTargetId());

        return dto;
    }
}

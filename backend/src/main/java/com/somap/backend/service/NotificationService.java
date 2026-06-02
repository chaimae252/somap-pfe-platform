package com.somap.backend.service;

import com.somap.backend.dto.NotificationDTO;
import com.somap.backend.enums.NotificationType;

import java.util.List;

public interface NotificationService {

    NotificationDTO createNotification(NotificationDTO notificationDTO);

    NotificationDTO notifyUser(Long utilisateurId, String titre, String message, NotificationType type);

    NotificationDTO notifyUser(Long utilisateurId, String titre, String message, NotificationType type, String targetType, Long targetId);

    void notifyAdmins(String titre, String message, NotificationType type, String targetType, Long targetId);

    List<NotificationDTO> getAllNotifications();

    NotificationDTO getNotificationById(Long id);

    void markAsRead(Long id);

    List<NotificationDTO> getNotificationsByClient(Long userId);

    long countUnreadByUser(Long userId);

    void deleteNotification(Long id);
}

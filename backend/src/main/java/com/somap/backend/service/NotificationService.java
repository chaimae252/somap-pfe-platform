package com.somap.backend.service;

import com.somap.backend.dto.NotificationDTO;

import java.util.List;

public interface NotificationService {

    NotificationDTO createNotification(NotificationDTO notificationDTO);

    List<NotificationDTO> getAllNotifications();

    NotificationDTO getNotificationById(Long id);

    void markAsRead(Long id);

    void deleteNotification(Long id);
}
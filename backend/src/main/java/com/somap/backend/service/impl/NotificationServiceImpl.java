package com.somap.backend.service.impl;

import com.somap.backend.dto.NotificationDTO;
import com.somap.backend.service.NotificationService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationServiceImpl implements NotificationService {

    @Override
    public NotificationDTO createNotification(NotificationDTO notificationDTO) {
        return null;
    }

    @Override
    public List<NotificationDTO> getAllNotifications() {
        return null;
    }

    @Override
    public NotificationDTO getNotificationById(Long id) {
        return null;
    }

    @Override
    public void markAsRead(Long id) {

    }

    @Override
    public void deleteNotification(Long id) {

    }
}
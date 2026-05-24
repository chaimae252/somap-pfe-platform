package com.somap.backend.controller;

import com.somap.backend.dto.NotificationDTO;
import com.somap.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping
    public ResponseEntity<NotificationDTO> createNotification(
            @RequestBody NotificationDTO notificationDTO
    ) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(notificationService.createNotification(notificationDTO));
    }

    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getAllNotifications() {

        return ResponseEntity.ok(
                notificationService.getAllNotifications()
        );
    }

    @GetMapping("/client/{id}")
    public List<NotificationDTO> getNotificationsByClient(
            @PathVariable Long id
    ) {
        System.out.println("[NOTIF DEBUG] NotificationController.getNotificationsByClient id=" + id);
        List<NotificationDTO> notifications = notificationService.getNotificationsByClient(id);
        System.out.println("[NOTIF DEBUG] NotificationController.getNotificationsByClient count="
                + notifications.size() + " id=" + id);
        return notifications;
    }

    @GetMapping("/{id}")
    public ResponseEntity<NotificationDTO> getNotificationById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                notificationService.getNotificationById(id)
        );
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<String> markAsRead(
            @PathVariable Long id
    ) {

        notificationService.markAsRead(id);

        return ResponseEntity.ok("Notification marquée comme lue");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteNotification(
            @PathVariable Long id
    ) {

        notificationService.deleteNotification(id);

        return ResponseEntity.ok("Notification supprimée avec succès");
    }
}

package com.somap.backend.service;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.HashMap;
import java.util.Map;

@Service
public class ExpoNotificationService {

    private final RestTemplate restTemplate = new RestTemplate();

    public void sendPushNotification(String expoPushToken, String title, String body) {
        sendPushNotification(expoPushToken, title, body, null);
    }

    public void sendPushNotification(String expoPushToken, String title, String body, Map<String, Object> data) {
        if (expoPushToken == null || !expoPushToken.startsWith("ExponentPushToken")) {
            return;
        }

        String url = "https://exp.host/--/api/v2/push/send";

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> payload = new HashMap<>();
            payload.put("to", expoPushToken);
            payload.put("title", title);
            payload.put("body", body);
            payload.put("sound", "default");
            payload.put("badge", 1);
            if (data != null && !data.isEmpty()) {
                payload.put("data", data);
            }

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
            restTemplate.postForObject(url, request, String.class);
            System.out.println("[EXPO PUSH] Notification sent successfully to " + expoPushToken);
        } catch (Exception e) {
            System.err.println("[EXPO PUSH] Error sending push notification: " + e.getMessage());
        }
    }
}

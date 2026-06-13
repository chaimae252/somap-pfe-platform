package com.somap.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${resend.api.key:}")
    private String resendApiKey;

    public void sendResetCode(
            String to,
            String code
    ) {
        if (resendApiKey != null && !resendApiKey.trim().isEmpty()) {
            sendViaResend(to, "Code de réinitialisation", "Votre code est : " + code);
        } else {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Code de réinitialisation");
            message.setText("Votre code est : " + code);
            mailSender.send(message);
        }
    }

    public void sendEmail(String to, String subject, String body) {
        if (resendApiKey != null && !resendApiKey.trim().isEmpty()) {
            sendViaResend(to, subject, body);
        } else {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        }
    }

    private void sendViaResend(String to, String subject, String body) {
        try {
            HttpClient client = HttpClient.newHttpClient();
            ObjectMapper mapper = new ObjectMapper();
            
            Map<String, Object> payload = new HashMap<>();
            payload.put("from", "onboarding@resend.dev");
            payload.put("to", to);
            payload.put("subject", subject);
            payload.put("html", "<p>" + body + "</p>");
            
            String jsonPayload = mapper.writeValueAsString(payload);
            
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .header("Authorization", "Bearer " + resendApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();
                    
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() >= 300) {
                throw new RuntimeException("Resend API failed with status code " + response.statusCode() + ": " + response.body());
            }
            System.out.println("Email sent successfully via Resend API: " + response.body());
        } catch (Exception e) {
            throw new RuntimeException("Error sending email via Resend API", e);
        }
    }
}
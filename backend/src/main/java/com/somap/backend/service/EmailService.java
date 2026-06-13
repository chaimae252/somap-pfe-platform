package com.somap.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.mail.internet.MimeMessage;

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

    @Value("${resend.from.email:onboarding@resend.dev}")
    private String resendFromEmail;

    @Value("${brevo.api.key:}")
    private String brevoApiKey;

    @Value("${brevo.from.email:}")
    private String brevoFromEmail;

    @Value("${spring.mail.username:}")
    private String springMailUsername;

    public void sendResetCode(
            String to,
            String code
    ) {
        String contentHtml = 
            "<h2>Réinitialisation de mot de passe</h2>" +
            "<p>Bonjour,</p>" +
            "<p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte SOMAP ET SERVICE. Veuillez utiliser le code de vérification ci-dessous pour poursuivre l'opération :</p>" +
            "<div class=\"code-container\">" +
            "  <div class=\"code-title\">Code de vérification</div>" +
            "  <div class=\"code-value\">" + code + "</div>" +
            "</div>" +
            "<p>Ce code est valable pendant 5 minutes. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité.</p>" +
            "<p>Cordialement,<br>L'équipe support SOMAP ET SERVICE</p>";
        
        String htmlBody = wrapInHtmlTemplate("Code de réinitialisation SOMAP ET SERVICE", contentHtml);
        sendHtmlEmail(to, "SOMAP ET SERVICE - Code de réinitialisation", htmlBody);
    }

    public void sendEmail(String to, String subject, String body) {
        String contentHtml = "<p>" + body.replace("\n", "<br/>") + "</p>";
        String htmlBody = wrapInHtmlTemplate(subject, contentHtml);
        sendHtmlEmail(to, subject, htmlBody);
    }

    private void sendHtmlEmail(String to, String subject, String contentHtml) {
        String formattedSubject = subject;
        if (subject != null && !subject.contains("SOMAP ET SERVICE")) {
            formattedSubject = "SOMAP ET SERVICE - " + subject;
        }
        if (brevoApiKey != null && !brevoApiKey.trim().isEmpty()) {
            sendViaBrevo(to, formattedSubject, contentHtml);
        } else if (resendApiKey != null && !resendApiKey.trim().isEmpty()) {
            sendViaResend(to, formattedSubject, contentHtml);
        } else {
            sendViaSMTP(to, formattedSubject, contentHtml);
        }
    }

    private void sendViaBrevo(String to, String subject, String contentHtml) {
        try {
            HttpClient client = HttpClient.newHttpClient();
            ObjectMapper mapper = new ObjectMapper();
            
            Map<String, String> sender = new HashMap<>();
            sender.put("name", "SOMAP ET SERVICE");
            sender.put("email", brevoFromEmail != null && !brevoFromEmail.trim().isEmpty() ? brevoFromEmail : springMailUsername);
            
            Map<String, String> recipient = new HashMap<>();
            recipient.put("email", to);
            java.util.List<Map<String, String>> toList = java.util.List.of(recipient);
            
            Map<String, Object> payload = new HashMap<>();
            payload.put("sender", sender);
            payload.put("to", toList);
            payload.put("subject", subject);
            payload.put("htmlContent", contentHtml);
            
            String jsonPayload = mapper.writeValueAsString(payload);
            
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                    .header("api-key", brevoApiKey)
                    .header("Content-Type", "application/json")
                    .header("accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();
                    
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() >= 300) {
                throw new RuntimeException("Brevo API failed with status code " + response.statusCode() + ": " + response.body());
            }
            System.out.println("Email sent successfully via Brevo API: " + response.body());
        } catch (Exception e) {
            throw new RuntimeException("Error sending email via Brevo API", e);
        }
    }

    private void sendViaSMTP(String to, String subject, String contentHtml) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(contentHtml, true);
            
            String from = "SOMAP ET SERVICE <" + springMailUsername + ">";
            helper.setFrom(from);
            
            mailSender.send(message);
            System.out.println("Email sent successfully via SMTP: " + subject);
        } catch (Exception e) {
            throw new RuntimeException("Error sending HTML email via SMTP", e);
        }
    }

    private void sendViaResend(String to, String subject, String contentHtml) {
        try {
            HttpClient client = HttpClient.newHttpClient();
            ObjectMapper mapper = new ObjectMapper();
            
            String sender = resendFromEmail;
            if (sender != null && !sender.contains("<")) {
                sender = "SOMAP ET SERVICE <" + sender + ">";
            }
            
            Map<String, Object> payload = new HashMap<>();
            payload.put("from", sender);
            payload.put("to", to);
            payload.put("subject", subject);
            payload.put("html", contentHtml);
            
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

    private String wrapInHtmlTemplate(String title, String contentHtml) {
        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "  <meta charset=\"utf-8\">\n" +
                "  <title>" + title + "</title>\n" +
                "  <style>\n" +
                "    body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 0; }\n" +
                "    .wrapper { width: 100%; background-color: #f4f6f9; padding: 40px 0; }\n" +
                "    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }\n" +
                "    .header { background: linear-gradient(135deg, #1271b8 0%, #0d2d5e 100%); padding: 30px; text-align: center; }\n" +
                "    .content { padding: 40px 30px; color: #333333; line-height: 1.6; }\n" +
                "    h2 { color: #1271b8; font-size: 22px; margin-top: 0; font-weight: 700; }\n" +
                "    p { font-size: 15px; color: #555555; }\n" +
                "    .code-container { background-color: #f0f7ff; border: 1.5px dashed #1271b8; border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0; }\n" +
                "    .code-title { font-size: 13px; text-transform: uppercase; letter-spacing: 2px; color: #1271b8; font-weight: bold; margin-bottom: 8px; }\n" +
                "    .code-value { font-size: 32px; font-weight: 800; color: #0d2d5e; letter-spacing: 6px; margin: 0; }\n" +
                "    .footer { background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #eef2f6; }\n" +
                "    .footer p { font-size: 12px; color: #999999; margin: 0; }\n" +
                "  </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "  <div class=\"wrapper\">\n" +
                "    <div class=\"container\">\n" +
                "      <div class=\"header\">\n" +
                "        <h1 style=\"color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px;\">SOMAP ET SERVICE</h1>\n" +
                "      </div>\n" +
                "      <div class=\"content\">\n" +
                "        " + contentHtml + "\n" +
                "      </div>\n" +
                "      <div class=\"footer\">\n" +
                "        <p>© 2026 SOMAP ET SERVICE. Tous droits réservés.</p>\n" +
                "      </div>\n" +
                "    </div>\n" +
                "  </div>\n" +
                "</body>\n" +
                "</html>";
    }
}

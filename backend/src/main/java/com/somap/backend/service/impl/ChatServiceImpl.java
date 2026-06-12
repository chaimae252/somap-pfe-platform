package com.somap.backend.service.impl;

import com.somap.backend.dto.ChatMessageDTO;
import com.somap.backend.repository.ServiceRepository;
import com.somap.backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    private final ServiceRepository serviceRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public String generateResponse(String message, List<ChatMessageDTO> history) {
        // Safety guard for unconfigured API key
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("YOUR_GEMINI_API_KEY")) {
            return "L'assistant virtuel de SOMAP est actuellement en cours de maintenance (Clé API non configurée).";
        }

        try {
            // 1. Fetch catalog context from database
            StringBuilder contextBuilder = new StringBuilder();
            contextBuilder.append("Vous êtes l'assistant virtuel officiel de l'entreprise SOMAP & SERVICE. ");
            contextBuilder.append("Répondez poliment et de manière professionnelle en français. ");
            contextBuilder.append("Utilisez uniquement les informations du catalogue ci-dessous pour renseigner le client. ");
            contextBuilder.append("Si l'utilisateur pose une question en dehors de nos prestations (comme de la cuisine, de la politique, ou du divertissement), ramenez-le poliment vers nos services industriels.\n\n");
            contextBuilder.append("[CATALOGUE DE NOS SERVICES]\n");

            serviceRepository.findAll().forEach(service -> {
                contextBuilder.append("- ").append(service.getTitre()).append(" : ").append(service.getDescription()).append("\n");
            });
            contextBuilder.append("[FIN DU CATALOGUE]\n\n");

            // 2. Format the payload for Gemini API
            List<Map<String, Object>> contents = new ArrayList<>();

            // Add history first (if any)
            if (history != null) {
                for (ChatMessageDTO msg : history) {
                    Map<String, Object> contentMap = new HashMap<>();
                    contentMap.put("role", msg.getSender().equals("user") ? "user" : "model");
                    
                    Map<String, String> part = new HashMap<>();
                    part.put("text", msg.getText());
                    contentMap.put("parts", Collections.singletonList(part));
                    contents.add(contentMap);
                }
            }

            // Add the system context + new message
            Map<String, Object> userContentMap = new HashMap<>();
            userContentMap.put("role", "user");
            
            Map<String, String> userPart = new HashMap<>();
            userPart.put("text", contextBuilder.toString() + "Question du client : " + message);
            userContentMap.put("parts", Collections.singletonList(userPart));
            contents.add(userContentMap);

            // Build request map
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", contents);

            // 3. Send HTTP request
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            String urlWithKey = apiUrl + "?key=" + apiKey;
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> responseEntity = restTemplate.postForEntity(urlWithKey, entity, Map.class);
            
            // 4. Parse response
            if (responseEntity.getStatusCode() == HttpStatus.OK && responseEntity.getBody() != null) {
                Map body = responseEntity.getBody();
                List candidates = (List) body.get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    Map firstCandidate = (Map) candidates.get(0);
                    Map content = (Map) firstCandidate.get("content");
                    if (content != null) {
                        List parts = (List) content.get("parts");
                        if (parts != null && !parts.isEmpty()) {
                            Map firstPart = (Map) parts.get(0);
                            return (String) firstPart.get("text");
                        }
                    }
                }
            }
            return "Désolé, je ne parviens pas à traiter votre demande pour le moment.";
        } catch (Exception e) {
            e.printStackTrace();
            return "Une erreur est survenue lors de la communication avec le serveur d'intelligence artificielle.";
        }
    }
}

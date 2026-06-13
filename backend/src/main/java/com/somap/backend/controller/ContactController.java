package com.somap.backend.controller;

import com.somap.backend.dto.ContactMessageRequestDTO;
import com.somap.backend.dto.ContactMessageResponseDTO;
import com.somap.backend.entity.Client;
import com.somap.backend.entity.ContactMessage;
import com.somap.backend.enums.ContactMessageStatus;
import com.somap.backend.mapper.ContactMessageMapper;
import com.somap.backend.repository.ClientRepository;
import com.somap.backend.repository.ContactMessageRepository;
import com.somap.backend.repository.AdminRepository;
import com.somap.backend.service.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
public class ContactController {

    private final ContactMessageRepository contactMessageRepository;
    private final ClientRepository clientRepository;
    private final ContactMessageMapper contactMessageMapper;
    private final EmailService emailService;
    private final AdminRepository adminRepository;

    @PostMapping
    public ResponseEntity<?> submitContactMessage(@Valid @RequestBody ContactMessageRequestDTO request) {
        // Get currently authenticated client
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Client client = null;

        if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
            String email = auth.getName();
            client = clientRepository.findByEmail(email).orElse(null);
        }

        ContactMessage message = contactMessageMapper.toEntity(request, client);
        contactMessageRepository.save(message);

        return ResponseEntity.ok().body("Message envoyé avec succès");
    }

    @GetMapping("/admin/messages")
    public ResponseEntity<List<ContactMessageResponseDTO>> getAllMessages() {
        List<ContactMessageResponseDTO> messages = contactMessageRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(contactMessageMapper::toResponseDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/admin/pending-count")
    public ResponseEntity<Long> getPendingCount() {
        long count = contactMessageRepository.countByStatus(ContactMessageStatus.PENDING);
        return ResponseEntity.ok(count);
    }

    @PutMapping("/admin/messages/{id}/read")
    public ResponseEntity<?> markMessageAsRead(@PathVariable Long id) {
        ContactMessage msg = contactMessageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Message introuvable"));
        if (msg.getStatus() == ContactMessageStatus.PENDING) {
            msg.setStatus(ContactMessageStatus.READ);
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
                String email = auth.getName();
                adminRepository.findByEmail(email).ifPresent(msg::setAdmin);
            }
            contactMessageRepository.save(msg);
        }
        return ResponseEntity.ok().body("Message marqué comme lu");
    }

    @PostMapping("/admin/messages/{id}/reply")
    public ResponseEntity<?> replyToMessage(@PathVariable Long id, @RequestParam String reply) {
        ContactMessage msg = contactMessageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Message introuvable"));
        
        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm");
        String formattedDate = msg.getCreatedAt() != null ? msg.getCreatedAt().format(formatter) : "";
        
        String subject = "Re: " + msg.getSubject();
        String body = "Bonjour " + msg.getName() + ",\n\n"
                + "Voici la réponse de l'administration SOMAP ET SERVICE à votre message du " + formattedDate + " :\n\n"
                + reply + "\n\n"
                + "Cordialement,\n"
                + "SOMAP ET SERVICE";
        
        emailService.sendEmail(msg.getEmail(), subject, body);

        msg.setStatus(ContactMessageStatus.REPLIED);
        msg.setAdminReply(reply);
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
            String email = auth.getName();
            adminRepository.findByEmail(email).ifPresent(msg::setAdmin);
        }
        contactMessageRepository.save(msg);

        return ResponseEntity.ok().body("Réponse envoyée avec succès");
    }

    @DeleteMapping("/admin/messages/{id}")
    public ResponseEntity<?> deleteMessage(@PathVariable Long id) {
        contactMessageRepository.deleteById(id);
        return ResponseEntity.ok().body("Message supprimé avec succès");
    }
}
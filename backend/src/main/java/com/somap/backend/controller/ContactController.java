package com.somap.backend.controller;

import com.somap.backend.dto.ContactMessageRequestDTO;
import com.somap.backend.entity.Client;
import com.somap.backend.entity.ContactMessage;
import com.somap.backend.mapper.ContactMessageMapper;
import com.somap.backend.repository.ClientRepository;
import com.somap.backend.repository.ContactMessageRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
public class ContactController {

    private final ContactMessageRepository contactMessageRepository;
    private final ClientRepository clientRepository;
    private final ContactMessageMapper contactMessageMapper;

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
}
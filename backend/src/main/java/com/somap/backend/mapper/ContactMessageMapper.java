package com.somap.backend.mapper;

import com.somap.backend.dto.ContactMessageRequestDTO;
import com.somap.backend.dto.ContactMessageResponseDTO;
import com.somap.backend.entity.Client;
import com.somap.backend.entity.ContactMessage;
import com.somap.backend.enums.ContactMessageStatus;  // <-- ADD THIS
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;

@Component
public class ContactMessageMapper {

    public ContactMessage toEntity(ContactMessageRequestDTO dto, Client client) {
        return ContactMessage.builder()
                .name(dto.getName())
                .email(dto.getEmail())
                .subject(dto.getSubject())
                .message(dto.getMessage())
                .client(client)
                .createdAt(LocalDateTime.now())
                .status(ContactMessageStatus.PENDING)   // resolves now
                .build();
    }

    public ContactMessageResponseDTO toResponseDTO(ContactMessage entity) {
        ContactMessageResponseDTO dto = new ContactMessageResponseDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setEmail(entity.getEmail());
        dto.setSubject(entity.getSubject());
        dto.setMessage(entity.getMessage());
        dto.setUserId(entity.getClient() != null ? entity.getClient().getId() : null);
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setStatus(entity.getStatus().name());   // resolves now
        dto.setAdminReply(entity.getAdminReply());
        return dto;
    }
}
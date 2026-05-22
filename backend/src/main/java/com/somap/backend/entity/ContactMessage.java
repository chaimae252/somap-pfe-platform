package com.somap.backend.entity;

import com.somap.backend.enums.ContactMessageStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "messages_contact") // French table name
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContactMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nom", nullable = false)
    private String name;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "sujet", nullable = false)
    private String subject;

    @Column(name = "message", nullable = false, length = 2000)
    private String message;

    @ManyToOne
    @JoinColumn(name = "utilisateur_id")
    private Client client; // or Utilisateur (if you want to keep generic)

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut")
    private ContactMessageStatus status;

    @Column(name = "reponse_admin", length = 500)
    private String adminReply;
}
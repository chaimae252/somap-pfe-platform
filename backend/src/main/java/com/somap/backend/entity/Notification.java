package com.somap.backend.entity;
import com.somap.backend.enums.NotificationType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titre;

    private String message;

    private LocalDateTime dateEnvoi;

    private boolean lu;

    @Enumerated(EnumType.STRING)
    private NotificationType type;

    private String targetType;

    private Long targetId;

    @ManyToOne
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;
}

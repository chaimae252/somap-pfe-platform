package com.somap.backend.entity;
import com.somap.backend.enums.ProjetStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Projet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titre;

    private String description;

    @Enumerated(EnumType.STRING)
    private ProjetStatus statut;

    private int progression;

    private LocalDateTime dateDebut;

    private LocalDateTime dateFin;

    @ManyToOne
    @JoinColumn(name = "client_id")
    private Client client;

    @OneToOne
    @JoinColumn(name = "demande_id")
    private Demande demande;
}

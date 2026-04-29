package com.somap.backend.entity;
import jakarta.persistence.*;
import lombok.*;
import java.util.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Service {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titre;

    private String description;

    private String image;

    @OneToMany(mappedBy = "service", cascade = CascadeType.ALL)
    private List<Demande> demandes;

    @OneToMany(mappedBy = "service", cascade = CascadeType.ALL)
    private List<Commentaire> commentaires;
}

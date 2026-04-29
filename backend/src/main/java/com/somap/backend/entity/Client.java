package com.somap.backend.entity;
import jakarta.persistence.*;
import lombok.*;
import java.util.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Client extends Utilisateur {

    private String telephone;

    private String adresse;

    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL)
    private List<Demande> demandes;

    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL)
    private List<Projet> projets;
}

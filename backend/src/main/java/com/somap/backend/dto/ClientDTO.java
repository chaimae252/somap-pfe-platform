package com.somap.backend.dto;

import lombok.Data;

import java.util.List;

@Data
public class ClientDTO {

    private Long id;
    private String nom;
    private String email;
    private String telephone;
    private String adresse;
    private long demandesCount;
    private long projetsCount;
    private List<String> demandeTitres;
    private List<String> projetTitres;

}

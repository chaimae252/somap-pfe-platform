package com.somap.backend.dto;

import lombok.Data;

@Data
public class ClientRegisterDTO {

    private String nom;
    private String email;
    private String motDePasse;

    private String telephone;
    private String adresse;
}
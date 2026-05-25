package com.somap.backend.dto;

import lombok.Data;

@Data
public class AdminRegisterDTO {

    private String nom;
    private String email;
    private String motDePasse;
}
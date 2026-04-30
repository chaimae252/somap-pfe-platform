package com.somap.backend.dto;

import lombok.Data;

@Data
public class LoginResponseDTO {

    private Long id;
    private String nom;
    private String email;
    private String role;
}
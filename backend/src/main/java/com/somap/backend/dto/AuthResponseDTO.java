package com.somap.backend.dto;

import lombok.Data;

@Data
public class AuthResponseDTO {
    private String token;
    private Long id;
    private String nom;
    private String email;
    private String role;
}
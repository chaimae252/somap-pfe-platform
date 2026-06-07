package com.somap.backend.dto;

import lombok.Data;

@Data
public class AuthResponseDTO {
    private String token;
    private String refreshToken;
    private Long id;
    private String nom;
    private String email;
    private String role;
}
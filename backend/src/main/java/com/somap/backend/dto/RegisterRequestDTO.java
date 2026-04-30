package com.somap.backend.dto;

import lombok.Data;

@Data
public class RegisterRequestDTO {

    private String nom;
    private String email;
    private String password;

}

package com.somap.backend.dto;

import lombok.Data;

@Data
public class LoginResponseDTO {

    private String token;
    private String role;
    private String email;

}

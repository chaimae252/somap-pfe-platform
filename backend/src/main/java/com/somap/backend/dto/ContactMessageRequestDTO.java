package com.somap.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ContactMessageRequestDTO {
    @NotBlank(message = "Le nom est requis")
    private String name;

    @Email(message = "Email invalide")
    @NotBlank(message = "L'email est requis")
    private String email;

    @NotBlank(message = "L'objet est requis")
    private String subject;

    @NotBlank(message = "Le message est requis")
    private String message;
}
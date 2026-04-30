package com.somap.backend.controller;

import com.somap.backend.dto.LoginRequestDTO;
import com.somap.backend.dto.LoginResponseDTO;
import com.somap.backend.dto.RegisterRequestDTO;
import com.somap.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<String> register(
            @RequestBody RegisterRequestDTO registerRequestDTO
    ) {

        authService.register(registerRequestDTO);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body("Utilisateur créé avec succès");
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(
            @RequestBody LoginRequestDTO loginRequestDTO
    ) {

        return ResponseEntity.ok(
                authService.login(loginRequestDTO)
        );
    }
}
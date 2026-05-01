package com.somap.backend.service.impl;

import com.somap.backend.dto.ClientRegisterDTO;
import com.somap.backend.dto.LoginRequestDTO;
import com.somap.backend.dto.LoginResponseDTO;
import com.somap.backend.entity.Client;
import com.somap.backend.entity.Utilisateur;
import com.somap.backend.enums.Role;
import com.somap.backend.repository.ClientRepository;
import com.somap.backend.repository.UtilisateurRepository;
import com.somap.backend.security.JwtService;
import com.somap.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final ClientRepository clientRepository;
    private final UtilisateurRepository utilisateurRepository;

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void registerClient(ClientRegisterDTO dto) {

        Client client = new Client();

        client.setNom(dto.getNom());
        client.setEmail(dto.getEmail());

        // 🔥 IMPORTANT FIX
        client.setMotDePasse(passwordEncoder.encode(dto.getMotDePasse()));

        client.setTelephone(dto.getTelephone());
        client.setAdresse(dto.getAdresse());
        client.setRole(Role.CLIENT);

        clientRepository.save(client);
    }

    @Override
    public LoginResponseDTO login(LoginRequestDTO dto) {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        dto.getEmail(),
                        dto.getMotDePasse()
                )
        );

        Utilisateur user = utilisateurRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtService.generateToken(user.getEmail());

        return new LoginResponseDTO(token);
    }
}
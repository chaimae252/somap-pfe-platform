package com.somap.backend.service.impl;

import com.somap.backend.dto.AuthResponseDTO;
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
import java.time.LocalDateTime;
import com.somap.backend.service.EmailService;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final ClientRepository clientRepository;
    private final UtilisateurRepository utilisateurRepository;

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Override
    @Transactional
    public AuthResponseDTO registerClient(ClientRegisterDTO dto) {

        Client client = new Client();
        client.setNom(dto.getNom());
        client.setEmail(dto.getEmail());
        client.setMotDePasse(passwordEncoder.encode(dto.getMotDePasse()));
        client.setTelephone(dto.getTelephone());
        client.setAdresse(dto.getAdresse());
        client.setRole(Role.CLIENT);

        clientRepository.save(client);

        String token = jwtService.generateToken(client);

        AuthResponseDTO response = new AuthResponseDTO();
        response.setToken(token);
        response.setId(client.getId());
        response.setNom(client.getNom());
        response.setEmail(client.getEmail());
        response.setRole("CLIENT");

        return response;
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

        String token = jwtService.generateToken(user);

        return new LoginResponseDTO(
                token,
                user.getId(),
                user.getNom(),
                user.getEmail(),
                user.getRole().name()
        );
    }

    @Override
public void forgotPassword(String email) {

    Utilisateur user = utilisateurRepository
            .findByEmail(email)
            .orElseThrow(() ->
                    new RuntimeException("Utilisateur non trouvé"));

    // Generate 4-digit code
    String code = String.valueOf(
            (int)(Math.random() * 9000) + 1000
    );

    user.setResetCode(code);

    user.setResetCodeExpiration(
            LocalDateTime.now().plusMinutes(5)
    );

    utilisateurRepository.save(user);

    emailService.sendResetCode(email, code);
} 
@Override
public boolean verifyCode(String email, String code) {

    Utilisateur user = utilisateurRepository
            .findByEmail(email)
            .orElseThrow(() ->
                    new RuntimeException("Utilisateur non trouvé"));

    return user.getResetCode().equals(code)
            && user.getResetCodeExpiration()
            .isAfter(LocalDateTime.now());
}
@Override
public void resetPassword(
        String email,
        String newPassword
) {

    Utilisateur user = utilisateurRepository
            .findByEmail(email)
            .orElseThrow(() ->
                    new RuntimeException("Utilisateur non trouvé"));

    user.setMotDePasse(
            passwordEncoder.encode(newPassword)
    );

    // remove old code
    user.setResetCode(null);
    user.setResetCodeExpiration(null);

    utilisateurRepository.save(user);
}
@Override
public void changePassword(String token, String currentPassword, String newPassword) {
    // Remove "Bearer " prefix if it exists
    if (token != null && token.startsWith("Bearer ")) {
        token = token.substring(7);
    }
    
    // Extract email using existing JwtService method
    String email = jwtService.extractUsername(token);
    Utilisateur user = utilisateurRepository.findByEmail(email)
        .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    
    // Verify current password
    if (!passwordEncoder.matches(currentPassword, user.getMotDePasse())) {
        throw new RuntimeException("Mot de passe actuel incorrect");
    }
    
    // Encode and save new password
    user.setMotDePasse(passwordEncoder.encode(newPassword));
    utilisateurRepository.save(user);
}
}
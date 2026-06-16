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
import com.somap.backend.dto.AdminRegisterDTO;
import com.somap.backend.entity.Admin;
import com.somap.backend.repository.AdminRepository;
import com.somap.backend.service.RefreshTokenService;
import com.somap.backend.entity.RefreshToken;
import com.somap.backend.dto.TokenRefreshRequestDTO;
import com.somap.backend.dto.TokenRefreshResponseDTO;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final ClientRepository clientRepository;
    private final AdminRepository adminRepository;
    private final UtilisateurRepository utilisateurRepository;

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final RefreshTokenService refreshTokenService;

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
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(client.getId());

        AuthResponseDTO response = new AuthResponseDTO();
        response.setToken(token);
        response.setRefreshToken(refreshToken.getToken());
        response.setId(client.getId());
        response.setNom(client.getNom());
        response.setEmail(client.getEmail());
        response.setRole("CLIENT");

        return response;
    }
    @Override
    @Transactional
    public AuthResponseDTO registerAdmin(AdminRegisterDTO dto) {

        // Check if email already exists
        if (utilisateurRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new RuntimeException("Email déjà utilisé");
        }

        Admin admin = new Admin();

        admin.setNom(dto.getNom());
        admin.setEmail(dto.getEmail());

        admin.setMotDePasse(
                passwordEncoder.encode(dto.getMotDePasse())
        );

        admin.setRole(Role.ADMIN);

        adminRepository.save(admin);

        String token = jwtService.generateToken(admin);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(admin.getId());

        AuthResponseDTO response = new AuthResponseDTO();

        response.setToken(token);
        response.setRefreshToken(refreshToken.getToken());
        response.setId(admin.getId());
        response.setNom(admin.getNom());
        response.setEmail(admin.getEmail());
        response.setRole("ADMIN");

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
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

        return new LoginResponseDTO(
                token,
                refreshToken.getToken(),
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

@Override
@Transactional
public void forgotPasswordLoggedIn(String token) {
    if (token != null && token.startsWith("Bearer ")) {
        token = token.substring(7);
    }
    
    String email = jwtService.extractUsername(token);
    Utilisateur user = utilisateurRepository.findByEmail(email)
        .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    
    String newPassword = generateRandomPassword();
    user.setMotDePasse(passwordEncoder.encode(newPassword));
    utilisateurRepository.save(user);

    String subject = "SOMAP ET SERVICE - Nouveau mot de passe proposé";
    String body = "Bonjour " + user.getNom() + ",\n\n" +
                  "Vous avez demandé la réinitialisation de votre mot de passe depuis votre espace profil.\n" +
                  "Voici votre nouveau mot de passe généré aléatoirement : " + newPassword + "\n\n" +
                  "Pour votre sécurité, nous vous invitons à copier ce mot de passe, à l'utiliser comme mot de passe actuel dans le formulaire pour ensuite le modifier avec le mot de passe de votre choix.\n\n" +
                  "Cordialement,\nL'équipe SOMAP ET SERVICE";
    
    emailService.sendEmail(email, subject, body);
}

@Override
@Transactional
public void forgotPasswordTemp(String email) {
    Utilisateur user = utilisateurRepository.findByEmail(email)
        .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    
    String newPassword = generateRandomPassword();
    user.setMotDePasse(passwordEncoder.encode(newPassword));
    utilisateurRepository.save(user);

    String subject = "SOMAP ET SERVICE - Récupération de mot de passe";
    String body = "Bonjour " + user.getNom() + ",\n\n" +
                  "Vous avez demandé la réinitialisation de votre mot de passe.\n" +
                  "Voici votre nouveau mot de passe temporaire pour vous connecter : " + newPassword + "\n\n" +
                  "Pour votre sécurité, nous vous invitons à l'utiliser pour vous connecter, puis à le modifier immédiatement dans votre profil.\n\n" +
                  "Cordialement,\nL'équipe SOMAP ET SERVICE";
    
    emailService.sendEmail(email, subject, body);
}


private String generateRandomPassword() {
    String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    java.security.SecureRandom random = new java.security.SecureRandom();
    StringBuilder sb = new StringBuilder();
    for (int i = 0; i < 10; i++) {
        sb.append(chars.charAt(random.nextInt(chars.length())));
    }
    return sb.toString();
}
    
    @Override
    @Transactional
    public TokenRefreshResponseDTO refreshToken(TokenRefreshRequestDTO request) {
        String requestRefreshToken = request.getRefreshToken();

        return refreshTokenService.findByToken(requestRefreshToken)
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    String token = jwtService.generateToken(user);
                    RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user.getId());
                    return new TokenRefreshResponseDTO(token, newRefreshToken.getToken());
                })
                .orElseThrow(() -> new RuntimeException("Le token de rafraîchissement n'est pas dans la base de données !"));
    }

    @Override
    @Transactional
    public void logout(Long userId) {
        refreshTokenService.deleteByUserId(userId);
    }
}
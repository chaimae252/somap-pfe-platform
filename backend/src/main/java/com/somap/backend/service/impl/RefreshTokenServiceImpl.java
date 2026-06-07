package com.somap.backend.service.impl;

import com.somap.backend.entity.RefreshToken;
import com.somap.backend.repository.RefreshTokenRepository;
import com.somap.backend.repository.UtilisateurRepository;
import com.somap.backend.service.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenServiceImpl implements RefreshTokenService {

    @Value("${jwt.refreshExpirationMs}")
    private Long refreshExpirationMs;

    private final RefreshTokenRepository refreshTokenRepository;
    private final UtilisateurRepository utilisateurRepository;

    @Override
    @Transactional
    public RefreshToken createRefreshToken(Long userId) {
        var user = utilisateurRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        
        // Clear any existing refresh token for the user
        refreshTokenRepository.deleteByUser(user);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiryDate(Instant.now().plusMillis(refreshExpirationMs))
                .build();

        return refreshTokenRepository.save(refreshToken);
    }

    @Override
    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    @Override
    @Transactional
    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().compareTo(Instant.now()) < 0) {
            refreshTokenRepository.delete(token);
            throw new RuntimeException("Refresh token expiré. Veuillez vous reconnecter.");
        }
        return token;
    }

    @Override
    @Transactional
    public void deleteByUserId(Long userId) {
        utilisateurRepository.findById(userId).ifPresent(refreshTokenRepository::deleteByUser);
    }
}

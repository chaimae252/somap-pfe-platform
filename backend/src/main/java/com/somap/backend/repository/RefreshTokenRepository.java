package com.somap.backend.repository;

import com.somap.backend.entity.RefreshToken;
import com.somap.backend.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    Optional<RefreshToken> findByUser(Utilisateur user);
    
    @Modifying
    int deleteByUser(Utilisateur user);
}

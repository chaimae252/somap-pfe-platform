package com.somap.backend.service;

import com.somap.backend.entity.RefreshToken;
import java.util.Optional;

public interface RefreshTokenService {
    RefreshToken createRefreshToken(Long userId);
    Optional<RefreshToken> findByToken(String token);
    RefreshToken verifyExpiration(RefreshToken token);
    void deleteByUserId(Long userId);
}

package com.somap.backend.security;

import com.somap.backend.entity.Utilisateur;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {
    @Value("${jwt.secret}")
    private String SECRET_KEY;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
    }

    // Generate token
    public String generateToken(Utilisateur user) {

        if (user.getRole() == null) {
            throw new RuntimeException("User role is null");
        }

        return Jwts.builder()
                .setSubject(user.getEmail())
                .claim("role", user.getRole().name())
                .compact();
    }

    // Extract username (email)
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // Validate token
    public boolean isTokenValid(String token, String email) {
        return extractUsername(token).equals(email) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private <T> T extractClaim(String token, Function<Claims, T> resolver) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return resolver.apply(claims);
    }
}

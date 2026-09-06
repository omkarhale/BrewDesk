package com.office.brewdesk.service;

import com.office.brewdesk.entity.RevokedToken;
import com.office.brewdesk.repository.RevokedTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class LogoutService {

    private final RevokedTokenRepository revokedTokenRepository;

    public void revokeToken(Jwt jwt) {

        String tokenHash = hashToken(jwt.getTokenValue());

        // Already revoked → nothing to do
        if (revokedTokenRepository.existsByTokenHash(tokenHash)) {
            return;
        }

        // Token already expired → no need to store it
        if (jwt.getExpiresAt() == null ||
                jwt.getExpiresAt().isBefore(Instant.now())) {
            return;
        }

        RevokedToken revokedToken = RevokedToken.builder()
                .tokenHash(tokenHash)
                .expiresAt(jwt.getExpiresAt())
                .build();

        revokedTokenRepository.save(revokedToken);
    }

    public boolean isTokenRevoked(String token) {

        String tokenHash = hashToken(token);

        return revokedTokenRepository.existsByTokenHash(tokenHash);
    }

    private String hashToken(String token) {

        try {

            MessageDigest digest =
                    MessageDigest.getInstance("SHA-256");

            byte[] hash =
                    digest.digest(
                            token.getBytes(StandardCharsets.UTF_8)
                    );

            StringBuilder hexString = new StringBuilder();

            for (byte b : hash) {

                String hex =
                        Integer.toHexString(0xff & b);

                if (hex.length() == 1) {
                    hexString.append('0');
                }

                hexString.append(hex);
            }

            return hexString.toString();

        } catch (NoSuchAlgorithmException e) {

            throw new IllegalStateException(
                    "SHA-256 algorithm not available", e
            );
        }
    }
}
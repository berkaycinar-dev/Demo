package com.demo.backend.auth;

import com.demo.backend.common.error.UnauthorizedException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Creates access tokens (JWT) and manages refresh tokens (opaque, single use, rotated).
 */
@Service
public class TokenService {

    static final String REFRESH_INVALID = "REFRESH_TOKEN_INVALID";

    private final JwtEncoder jwtEncoder;
    private final JwtProperties props;
    private final RefreshTokenRepository refreshTokens;
    private final Clock clock;
    private final SecureRandom random = new SecureRandom();

    public TokenService(JwtEncoder jwtEncoder, JwtProperties props, RefreshTokenRepository refreshTokens, Clock clock) {
        this.jwtEncoder = jwtEncoder;
        this.props = props;
        this.refreshTokens = refreshTokens;
        this.clock = clock;
    }

    public long accessTtlSeconds() {
        return props.accessTtlSeconds();
    }

    /** JWT with iss, sub (user id), iat, exp, jti and username. No roles: room roles are read from the DB. */
    public String createAccessToken(UUID userId, String username) {
        Instant now = clock.instant();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(props.issuer())
                .subject(userId.toString())
                .issuedAt(now)
                .expiresAt(now.plusSeconds(props.accessTtlSeconds()))
                .id(UUID.randomUUID().toString())
                .claim("username", username)
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    /** Creates a new refresh token, stores its hash, returns the raw value (shown to the client once). */
    @Transactional
    public String issueRefreshToken(UUID userId) {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        Instant now = clock.instant();
        refreshTokens.save(new RefreshToken(userId, hash(raw), now.plus(props.refreshTtlDays(), ChronoUnit.DAYS), now));
        return raw;
    }

    /**
     * Checks the token and marks it as used (single use). Returns the owner's user id.
     * If the token was already used, someone may have stolen it: all tokens of that user are revoked.
     *
     * noRollbackFor: the revoke-all update must be kept even though we throw 401 afterwards.
     */
    @Transactional(noRollbackFor = UnauthorizedException.class)
    public UUID consumeRefreshToken(String raw) {
        Instant now = clock.instant();
        RefreshToken token = refreshTokens.findByTokenHash(hash(raw)).orElseThrow(TokenService::invalid);

        if (token.getRevokedAt() != null || !token.getExpiresAt().isAfter(now)) {
            throw invalid();
        }
        if (token.getUsedAt() != null || refreshTokens.markUsed(token.getId(), now) == 0) {
            refreshTokens.revokeAllForUser(token.getUserId(), now);
            throw invalid();
        }
        return token.getUserId();
    }

    /** Revokes one refresh token (logout). Unknown token is ignored: logout always succeeds (contract: 204). */
    @Transactional
    public void revokeRefreshToken(String raw) {
        refreshTokens.findByTokenHash(hash(raw))
                .ifPresent(token -> refreshTokens.revoke(token.getId(), clock.instant()));
    }

    static String hash(String raw) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }

    private static UnauthorizedException invalid() {
        return new UnauthorizedException(REFRESH_INVALID, "Refresh token is invalid, expired or already used.");
    }
}

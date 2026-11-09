package com.demo.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.demo.backend.common.error.UnauthorizedException;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import com.nimbusds.jose.jwk.source.ImmutableSecret;

/** Unit test: real JWT encode/decode, refresh token repository is a mock. No Spring, no database. */
class TokenServiceTest {

    private static final Instant NOW = Instant.parse("2026-11-07T10:00:00Z");
    private static final String SECRET = "unit-test-secret-0123456789abcdef-xyz";

    private final JwtProperties props = new JwtProperties(SECRET, "demo-backend", 900, 14);
    private final SecretKeySpec key = new SecretKeySpec(SECRET.getBytes(), "HmacSHA256");
    private final JwtEncoder encoder = new NimbusJwtEncoder(new ImmutableSecret<>(key));
    private final RefreshTokenRepository repo = mock(RefreshTokenRepository.class);
    private final Clock clock = Clock.fixed(NOW, ZoneOffset.UTC);
    private final TokenService service = new TokenService(encoder, props, repo, clock);

    @Test
    void accessTokenHasExpectedClaims() {
        UUID id = UUID.randomUUID();
        String token = service.createAccessToken(id, "ada_l");

        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
        // The test clock is fixed in the past, so skip the real-time "expired" check; claims are asserted below.
        decoder.setJwtValidator(jwt -> org.springframework.security.oauth2.core.OAuth2TokenValidatorResult.success());
        Jwt jwt = decoder.decode(token);

        assertThat(jwt.getSubject()).isEqualTo(id.toString());
        assertThat(jwt.getClaimAsString("iss")).isEqualTo("demo-backend");
        assertThat(jwt.getClaimAsString("username")).isEqualTo("ada_l");
        assertThat(jwt.getIssuedAt()).isEqualTo(NOW);
        assertThat(jwt.getExpiresAt()).isEqualTo(NOW.plusSeconds(900));
        assertThat(jwt.getId()).isNotBlank();
    }

    @Test
    void issueRefreshTokenStoresOnlyTheHash() {
        UUID userId = UUID.randomUUID();
        String raw = service.issueRefreshToken(userId);

        org.mockito.ArgumentCaptor<RefreshToken> saved = org.mockito.ArgumentCaptor.forClass(RefreshToken.class);
        verify(repo).save(saved.capture());

        assertThat(raw).hasSizeGreaterThan(30);
        assertThat(saved.getValue().getTokenHash()).isEqualTo(TokenService.hash(raw)).isNotEqualTo(raw);
        assertThat(saved.getValue().getUserId()).isEqualTo(userId);
        assertThat(saved.getValue().getExpiresAt()).isEqualTo(NOW.plus(14, ChronoUnit.DAYS));
    }

    @Test
    void consumeValidTokenReturnsUserAndMarksUsed() {
        UUID userId = UUID.randomUUID();
        RefreshToken token = stored(userId, NOW.plusSeconds(60), null, null);
        when(repo.findByTokenHash(TokenService.hash("raw"))).thenReturn(Optional.of(token));
        when(repo.markUsed(any(), any())).thenReturn(1);

        assertThat(service.consumeRefreshToken("raw")).isEqualTo(userId);
    }

    @Test
    void consumeUnknownTokenIsRejected() {
        when(repo.findByTokenHash(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.consumeRefreshToken("nope"))
                .isInstanceOfSatisfying(UnauthorizedException.class,
                        e -> assertThat(e.getCode()).isEqualTo("REFRESH_TOKEN_INVALID"));
    }

    @Test
    void consumeExpiredTokenIsRejected() {
        RefreshToken token = stored(UUID.randomUUID(), NOW.minusSeconds(1), null, null);
        when(repo.findByTokenHash(any())).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> service.consumeRefreshToken("raw")).isInstanceOf(UnauthorizedException.class);
        verify(repo, never()).markUsed(any(), any());
    }

    @Test
    void reusedTokenRevokesAllTokensOfThatUser() {
        UUID userId = UUID.randomUUID();
        RefreshToken token = stored(userId, NOW.plusSeconds(60), NOW.minusSeconds(5), null);
        when(repo.findByTokenHash(any())).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> service.consumeRefreshToken("raw")).isInstanceOf(UnauthorizedException.class);
        verify(repo).revokeAllForUser(userId, NOW);
    }

    @Test
    void lostRaceAlsoCountsAsReuse() {
        UUID userId = UUID.randomUUID();
        RefreshToken token = stored(userId, NOW.plusSeconds(60), null, null);
        when(repo.findByTokenHash(any())).thenReturn(Optional.of(token));
        when(repo.markUsed(any(), any())).thenReturn(0);

        assertThatThrownBy(() -> service.consumeRefreshToken("raw")).isInstanceOf(UnauthorizedException.class);
        verify(repo).revokeAllForUser(userId, NOW);
    }

    @Test
    void revokeUnknownTokenDoesNothing() {
        when(repo.findByTokenHash(any())).thenReturn(Optional.empty());

        service.revokeRefreshToken("nope");

        verify(repo, never()).revoke(any(), any());
    }

    @Test
    void revokeKnownTokenRevokesIt() {
        RefreshToken token = stored(UUID.randomUUID(), NOW.plusSeconds(60), null, null);
        when(repo.findByTokenHash(any())).thenReturn(Optional.of(token));

        service.revokeRefreshToken("raw");

        verify(repo).revoke(token.getId(), NOW);
    }

    private RefreshToken stored(UUID userId, Instant expiresAt, Instant usedAt, Instant revokedAt) {
        RefreshToken token = new RefreshToken(userId, "hash", expiresAt, NOW.minusSeconds(100));
        setField(token, "usedAt", usedAt);
        setField(token, "revokedAt", revokedAt);
        return token;
    }

    private static void setField(Object target, String name, Object value) {
        try {
            var f = target.getClass().getDeclaredField(name);
            f.setAccessible(true);
            f.set(target, value);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(e);
        }
    }
}

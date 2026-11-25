package com.demo.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class JwtConfigTest {

    private static final String STRONG = "3f9a1c7e5b2d8f4a6c0e1b3d5f7a9c2e4b6d8f0a1c3e5b7d9f2a4c6e8b0d1f3a";

    @Test
    void rejectsShortSecret() {
        assertThatThrownBy(() -> JwtConfig.secretKey("too-short", false))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("at least 32 bytes");
    }

    @Test
    void rejectsMissingSecret() {
        assertThatThrownBy(() -> JwtConfig.secretKey(null, true))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void prodRejectsPublicDevSecret() {
        assertThatThrownBy(() -> JwtConfig.secretKey(JwtConfig.DEV_SECRET, true))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("development value");
    }

    @Test
    void localDevMayUseDevSecret() {
        assertThat(JwtConfig.secretKey(JwtConfig.DEV_SECRET, false).getAlgorithm()).isEqualTo("HmacSHA256");
    }

    @Test
    void prodAcceptsStrongSecret() {
        assertThat(JwtConfig.secretKey(STRONG, true).getAlgorithm()).isEqualTo("HmacSHA256");
    }
}

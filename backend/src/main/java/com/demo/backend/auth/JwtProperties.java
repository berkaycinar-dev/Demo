package com.demo.backend.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Settings under {@code app.jwt} in application.yml. */
@ConfigurationProperties(prefix = "app.jwt")
public record JwtProperties(
        String secret,
        String issuer,
        long accessTtlSeconds,
        long refreshTtlDays) {
}

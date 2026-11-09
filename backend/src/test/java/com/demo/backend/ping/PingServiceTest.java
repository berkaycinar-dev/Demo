package com.demo.backend.ping;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;

/**
 * Pure unit test: no Spring, no database, no HTTP. Runs in milliseconds.
 * Every business rule (points, timer, "at desk") will be tested in this style.
 */
class PingServiceTest {

    private static final Instant FIXED_NOW = Instant.parse("2026-10-29T20:00:00Z");

    private final PingService service = new PingService(Clock.fixed(FIXED_NOW, ZoneOffset.UTC));

    @Test
    void returnsPong() {
        assertThat(service.ping().message()).isEqualTo("pong");
    }

    @Test
    void usesInjectedClockForServerTime() {
        assertThat(service.ping().serverTime()).isEqualTo(FIXED_NOW);
    }
}

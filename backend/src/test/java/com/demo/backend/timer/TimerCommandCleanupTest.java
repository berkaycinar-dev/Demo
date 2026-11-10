package com.demo.backend.timer;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class TimerCommandCleanupTest {

    private static final Instant NOW = Instant.parse("2026-11-10T10:00:00Z");

    private final TimerService service = mock(TimerService.class);
    private final TimerCommandCleanup cleanup =
            new TimerCommandCleanup(service, Clock.fixed(NOW, ZoneOffset.UTC), 24);

    @Test
    void forgetsCommandsOlderThanTheRetention() {
        cleanup.cleanUp();

        verify(service).forgetCommandsOlderThan(NOW.minusSeconds(24 * 3600));
    }

    @Test
    void aFailedRunDoesNotThrow() {
        when(service.forgetCommandsOlderThan(NOW.minusSeconds(24 * 3600)))
                .thenThrow(new IllegalStateException("db down"));

        cleanup.cleanUp(); // must not throw, or the schedule would stop
    }
}

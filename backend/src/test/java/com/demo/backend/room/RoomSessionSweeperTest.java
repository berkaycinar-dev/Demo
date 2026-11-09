package com.demo.backend.room;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class RoomSessionSweeperTest {

    private static final Instant NOW = Instant.parse("2026-11-09T10:00:00Z");

    private final RoomSessionService service = mock(RoomSessionService.class);
    private final RoomSessionSweeper sweeper =
            new RoomSessionSweeper(service, Clock.fixed(NOW, ZoneOffset.UTC), 60);

    @Test
    void closesSessionsNotSeenForTheTimeout() {
        sweeper.sweep();

        verify(service).closeStale(NOW.minusSeconds(60));
    }

    @Test
    void aFailedRunDoesNotThrow() {
        when(service.closeStale(NOW.minusSeconds(60))).thenThrow(new IllegalStateException("db down"));

        sweeper.sweep(); // must not throw, or the schedule would stop
    }
}

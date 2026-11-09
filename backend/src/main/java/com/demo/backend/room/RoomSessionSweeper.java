package com.demo.backend.room;

import java.time.Clock;
import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Background job: closes sessions whose connection was lost.
 *
 * A client sends a heartbeat while it is in the room. If none arrives for
 * {@code app.room-sessions.timeout-seconds} (default 60), the session ends with reason TIMEOUT.
 * The value is shared with D's real-time side, so change it only together with D.
 */
@Component
public class RoomSessionSweeper {

    private static final Logger log = LoggerFactory.getLogger(RoomSessionSweeper.class);

    private final RoomSessionService sessionService;
    private final Clock clock;
    private final Duration timeout;

    public RoomSessionSweeper(RoomSessionService sessionService, Clock clock,
                              @Value("${app.room-sessions.timeout-seconds:60}") long timeoutSeconds) {
        this.sessionService = sessionService;
        this.clock = clock;
        this.timeout = Duration.ofSeconds(timeoutSeconds);
    }

    @Scheduled(fixedDelayString = "${app.room-sessions.sweep-interval-ms:15000}")
    public void sweep() {
        try {
            int closed = sessionService.closeStale(clock.instant().minus(timeout));
            if (closed > 0) {
                log.info("[room-sessions] closed {} stale session(s)", closed);
            }
        } catch (RuntimeException ex) {
            // Never let one failed run stop the schedule; the next run tries again.
            log.error("[room-sessions] sweep failed", ex);
        }
    }
}

package com.demo.backend.timer;

import java.time.Instant;
import java.util.UUID;

/**
 * Payload of the TIMER_* room events (see the "timer" tag in openapi.yaml).
 * For TIMER_FINISHED, {@code phase} is the phase that ended and {@code endsAt} is when it ended.
 */
public record TimerEvent(
        UUID userId,
        String preset,
        TimerPhase phase,
        Instant endsAt,
        int remainingSeconds,
        long version,
        Instant occurredAt) {

    public static final String STARTED = "TIMER_STARTED";
    public static final String PAUSED = "TIMER_PAUSED";
    public static final String RESET = "TIMER_RESET";
    public static final String FINISHED = "TIMER_FINISHED";
}

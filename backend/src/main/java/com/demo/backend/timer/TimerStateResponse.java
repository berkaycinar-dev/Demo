package com.demo.backend.timer;

import java.time.Duration;
import java.time.Instant;

/** Matches TimerStateResponse in openapi.yaml. */
public record TimerStateResponse(
        String preset,
        TimerPhase phase,
        TimerStatus status,
        Instant endsAt,
        int remainingSeconds,
        int totalSeconds,
        long version,
        int completedFocusBlocks,
        Instant serverTime) {

    static TimerStateResponse of(TimerState s, Instant now) {
        return new TimerStateResponse(s.getPreset(), s.getPhase(), s.getStatus(), s.getEndsAt(),
                s.remainingAt(now), s.totalSeconds(), s.getVersion(), s.getCompletedFocusBlocks(), now);
    }

    /** The answer to a command id that was already applied: the state it produced. */
    static TimerStateResponse of(TimerCommand c, Instant now) {
        int remaining = c.getStatus() == TimerStatus.RUNNING
                ? (int) Math.max(0, (Duration.between(now, c.getEndsAt()).toMillis() + 999) / 1000)
                : c.getRemainingSeconds();
        return new TimerStateResponse(c.getPreset(), c.getPhase(), c.getStatus(), c.getEndsAt(), remaining,
                TimerPreset.of(c.getPreset()).seconds(c.getPhase()), c.getResultingVersion(),
                c.getCompletedFocusBlocks(), now);
    }
}

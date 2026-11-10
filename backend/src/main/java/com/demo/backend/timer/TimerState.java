package com.demo.backend.timer;

import com.demo.backend.common.error.BusinessRuleException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * One user's Pomodoro timer. Maps the {@code timer_states} table (V6) and holds all the timer rules,
 * so they can be tested without a database.
 *
 * The timer does not tick. While RUNNING it keeps {@code endsAt}; {@link #settle} works out what
 * happened since the last look, and {@link #apply} runs one user command. Every change adds 1 to
 * {@code version}. Callers hold a row lock while they use this class.
 */
@Entity
@Table(name = "timer_states")
public class TimerState {

    /** A phase that ran out by itself, and when. */
    public record Finished(TimerPhase phase, Instant endedAt) {
    }

    /** What {@link #apply} did, for the event to publish. */
    public enum Change {
        STARTED,
        PAUSED,
        RESET
    }

    @Id
    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(nullable = false, length = 10)
    private String preset;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TimerPhase phase;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TimerStatus status;

    @Column(name = "ends_at")
    private Instant endsAt;

    /** Seconds left. Exact while IDLE or PAUSED; while RUNNING it is the phase length (endsAt is the truth). */
    @Column(name = "remaining_seconds", nullable = false)
    private int remainingSeconds;

    @Column(nullable = false)
    private long version;

    @Column(name = "completed_focus_blocks", nullable = false)
    private int completedFocusBlocks;

    protected TimerState() {
        // for JPA
    }

    /** A fresh idle timer with the default preset. */
    public static TimerState idle(UUID userId) {
        TimerState s = new TimerState();
        s.userId = userId;
        s.preset = TimerPreset.DEFAULT.id();
        s.toIdle();
        return s;
    }

    /**
     * Applies what happened while nobody looked. If the running phase has ended, the next phase starts
     * from the exact end time (so nothing drifts). If that phase has also ended, nobody was around:
     * the timer stops at IDLE and waits for a new START. Returns the phases that ran out (0 to 2).
     */
    public List<Finished> settle(Instant now) {
        List<Finished> finished = new ArrayList<>();
        if (status != TimerStatus.RUNNING || endsAt.isAfter(now)) {
            return finished;
        }
        TimerPreset p = TimerPreset.of(preset);
        Instant ended = endsAt;
        finished.add(new Finished(phase, ended));
        if (phase == TimerPhase.FOCUS) {
            completedFocusBlocks++;
        }
        TimerPhase next = other(phase);
        Instant nextEnd = ended.plusSeconds(p.seconds(next));
        if (nextEnd.isAfter(now)) {
            phase = next;
            remainingSeconds = p.seconds(next);
            endsAt = nextEnd;
        } else {
            if (next == TimerPhase.BREAK) {
                finished.add(new Finished(TimerPhase.BREAK, nextEnd));
            }
            toIdle();
        }
        version++;
        return finished;
    }

    /**
     * Runs one command on a settled timer. Throws 409 INVALID_TIMER_TRANSITION when the command does
     * not fit the current status, 409 INVALID_PRESET for an unknown preset.
     */
    public Change apply(TimerCommandType type, String newPreset, Instant now) {
        Change change;
        switch (type) {
            case START -> {
                require(status == TimerStatus.IDLE, type);
                run(now);
                change = Change.STARTED;
            }
            case PAUSE -> {
                require(status == TimerStatus.RUNNING, type);
                remainingSeconds = (int) Math.max(1, secondsLeft(now));
                status = TimerStatus.PAUSED;
                endsAt = null;
                change = Change.PAUSED;
            }
            case RESUME -> {
                require(status == TimerStatus.PAUSED, type);
                run(now);
                change = Change.STARTED;
            }
            case SKIP -> {
                require(status == TimerStatus.RUNNING || status == TimerStatus.PAUSED, type);
                phase = other(phase);
                remainingSeconds = TimerPreset.of(preset).seconds(phase);
                run(now);
                change = Change.STARTED;
            }
            case RESET -> {
                toIdle();
                change = Change.RESET;
            }
            case SET_PRESET -> {
                preset = TimerPreset.find(newPreset)
                        .orElseThrow(() -> new BusinessRuleException("INVALID_PRESET",
                                "Unknown preset. Use 25-5, 50-10 or 90-15."))
                        .id();
                toIdle();
                change = Change.RESET;
            }
            default -> throw new IllegalStateException("Unhandled command: " + type);
        }
        version++;
        return change;
    }

    /** Seconds left as of {@code now}, rounded up. */
    public int remainingAt(Instant now) {
        return status == TimerStatus.RUNNING ? (int) Math.max(0, secondsLeft(now)) : remainingSeconds;
    }

    public int totalSeconds() {
        return TimerPreset.of(preset).seconds(phase);
    }

    private void run(Instant now) {
        status = TimerStatus.RUNNING;
        endsAt = now.plusSeconds(remainingSeconds);
    }

    private void toIdle() {
        phase = TimerPhase.FOCUS;
        status = TimerStatus.IDLE;
        endsAt = null;
        remainingSeconds = TimerPreset.of(preset).focusSeconds();
    }

    private long secondsLeft(Instant now) {
        long millis = Duration.between(now, endsAt).toMillis();
        return (millis + 999) / 1000;
    }

    private void require(boolean ok, TimerCommandType type) {
        if (!ok) {
            throw new BusinessRuleException("INVALID_TIMER_TRANSITION",
                    type + " is not possible while the timer is " + status + ".");
        }
    }

    private static TimerPhase other(TimerPhase p) {
        return p == TimerPhase.FOCUS ? TimerPhase.BREAK : TimerPhase.FOCUS;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getPreset() {
        return preset;
    }

    public TimerPhase getPhase() {
        return phase;
    }

    public TimerStatus getStatus() {
        return status;
    }

    public Instant getEndsAt() {
        return endsAt;
    }

    public int getRemainingSeconds() {
        return remainingSeconds;
    }

    public long getVersion() {
        return version;
    }

    public int getCompletedFocusBlocks() {
        return completedFocusBlocks;
    }
}

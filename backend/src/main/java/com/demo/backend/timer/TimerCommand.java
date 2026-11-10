package com.demo.backend.timer;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * A command that was already applied, with the timer state right after it. Maps {@code timer_commands} (V6).
 * If the same command id comes again, this snapshot is the answer and nothing is applied twice.
 */
@Entity
@Table(name = "timer_commands")
public class TimerCommand {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(name = "command_id", nullable = false, updatable = false)
    private UUID commandId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, updatable = false, length = 12)
    private TimerCommandType type;

    @Column(name = "resulting_version", nullable = false, updatable = false)
    private long resultingVersion;

    @Column(nullable = false, updatable = false, length = 10)
    private String preset;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, updatable = false, length = 10)
    private TimerPhase phase;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, updatable = false, length = 10)
    private TimerStatus status;

    @Column(name = "ends_at", updatable = false)
    private Instant endsAt;

    @Column(name = "remaining_seconds", nullable = false, updatable = false)
    private int remainingSeconds;

    @Column(name = "completed_focus_blocks", nullable = false, updatable = false)
    private int completedFocusBlocks;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected TimerCommand() {
        // for JPA
    }

    /** Records the command together with the state it produced. */
    public TimerCommand(UUID commandId, TimerCommandType type, TimerState after, Instant createdAt) {
        this.userId = after.getUserId();
        this.commandId = commandId;
        this.type = type;
        this.resultingVersion = after.getVersion();
        this.preset = after.getPreset();
        this.phase = after.getPhase();
        this.status = after.getStatus();
        this.endsAt = after.getEndsAt();
        this.remainingSeconds = after.getRemainingSeconds();
        this.completedFocusBlocks = after.getCompletedFocusBlocks();
        this.createdAt = createdAt;
    }

    public UUID getUserId() {
        return userId;
    }

    public UUID getCommandId() {
        return commandId;
    }

    public TimerCommandType getType() {
        return type;
    }

    public long getResultingVersion() {
        return resultingVersion;
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

    public int getCompletedFocusBlocks() {
        return completedFocusBlocks;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

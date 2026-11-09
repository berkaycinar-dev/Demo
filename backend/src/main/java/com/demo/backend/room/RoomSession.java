package com.demo.backend.room;

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

/** One visit of one user to one room. Maps the {@code room_sessions} table (V5). Open while endedAt is null. */
@Entity
@Table(name = "room_sessions")
public class RoomSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "room_id", nullable = false, updatable = false)
    private UUID roomId;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(name = "started_at", nullable = false, updatable = false)
    private Instant startedAt;

    @Column(name = "last_seen_at", nullable = false)
    private Instant lastSeenAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "end_reason", length = 10)
    private SessionEndReason endReason;

    protected RoomSession() {
        // for JPA
    }

    public RoomSession(UUID roomId, UUID userId, Instant startedAt) {
        this.roomId = roomId;
        this.userId = userId;
        this.startedAt = startedAt;
        this.lastSeenAt = startedAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getRoomId() {
        return roomId;
    }

    public UUID getUserId() {
        return userId;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public Instant getLastSeenAt() {
        return lastSeenAt;
    }

    public Instant getEndedAt() {
        return endedAt;
    }

    public SessionEndReason getEndReason() {
        return endReason;
    }

    public boolean isOpen() {
        return endedAt == null;
    }

    /** Marks the user as still connected. Ignored once the session has ended. */
    public void touch(Instant now) {
        if (isOpen() && now.isAfter(lastSeenAt)) {
            lastSeenAt = now;
        }
    }

    /** Closes the session. Ignored if it is already closed. */
    public void end(SessionEndReason reason, Instant now) {
        if (!isOpen()) {
            return;
        }
        this.endedAt = now.isBefore(startedAt) ? startedAt : now;
        this.endReason = reason;
    }
}

package com.samedesk.backend.room;

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

    // Desk seat (0-based), given on enter and kept for the visit. Null only for sessions older than V9.
    @Column(name = "seat")
    private Integer seat;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private PresenceStatus status = PresenceStatus.IDLE;

    // Break spot id while on BREAK, otherwise null (V9 CHECK).
    @Column(name = "break_spot", length = 40)
    private String breakSpot;

    // Which place of the break spot (0-based), set together with breakSpot (V9 CHECK).
    @Column(name = "break_slot")
    private Integer breakSlot;

    @Column(name = "status_since", nullable = false)
    private Instant statusSince;

    protected RoomSession() {
        // for JPA
    }

    public RoomSession(UUID roomId, UUID userId, Instant startedAt) {
        this.roomId = roomId;
        this.userId = userId;
        this.startedAt = startedAt;
        this.lastSeenAt = startedAt;
        this.statusSince = startedAt;
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

    public PresenceStatus getStatus() {
        return status;
    }

    public String getBreakSpot() {
        return breakSpot;
    }

    public Instant getStatusSince() {
        return statusSince;
    }

    public Integer getBreakSlot() {
        return breakSlot;
    }

    public Integer getSeat() {
        return seat;
    }

    /** Gives the desk seat. RoomSessionService picks a free one under the room lock. */
    public void takeSeat(int seat) {
        this.seat = seat;
    }

    /**
     * Sets what the person is doing. The spot and its place are kept only on BREAK (and only together).
     * statusSince moves only when the status itself changes (walking to another spot during the same
     * break keeps it). Counts as a heartbeat.
     */
    public void changeStatus(PresenceStatus next, String spot, Integer slot, Instant now) {
        if (!isOpen()) {
            return;
        }
        if (next != status) {
            statusSince = now;
        }
        status = next;
        boolean atSpot = next == PresenceStatus.BREAK && spot != null && slot != null;
        breakSpot = atSpot ? spot : null;
        breakSlot = atSpot ? slot : null;
        touch(now);
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

package com.samedesk.backend.room;

import java.time.Instant;

/**
 * Matches SessionStatusResponse in openapi.yaml: the caller's status in the room after a change.
 * spot / slot: the break spot and the place the server gave (may differ from the one asked for).
 */
public record SessionStatusResponse(PresenceStatus status, String spot, Integer slot, Instant statusSince) {

    static SessionStatusResponse of(RoomSession s) {
        return new SessionStatusResponse(s.getStatus(), s.getBreakSpot(), s.getBreakSlot(), s.getStatusSince());
    }
}

package com.samedesk.backend.room;

import com.fasterxml.jackson.annotation.JsonRawValue;
import java.time.Instant;
import java.util.UUID;

/**
 * Matches ActiveMemberResponse in openapi.yaml: one person who is inside the room right now.
 * avatar is that user's stored avatar JSON object as is, or null if they never saved one.
 * seat: their desk seat (0-based), the same on every screen.
 * status / spot / slot / statusSince: what they are doing, the break spot and place (only while on
 * BREAK) and since when.
 */
public record ActiveMemberResponse(UUID userId, String username, RoomRole role, Instant startedAt,
                                   @JsonRawValue String avatar, Integer seat, PresenceStatus status, String spot,
                                   Integer slot, Instant statusSince) {

    public static ActiveMemberResponse of(RoomSessionRepository.ActiveSession s) {
        return new ActiveMemberResponse(s.getUserId(), s.getUsername(), s.getRole(), s.getStartedAt(), s.getAvatar(),
                s.getSeat(), s.getStatus(), s.getBreakSpot(), s.getBreakSlot(), s.getStatusSince());
    }
}

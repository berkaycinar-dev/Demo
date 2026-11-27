package com.samedesk.backend.room;

import com.fasterxml.jackson.annotation.JsonRawValue;
import java.time.Instant;
import java.util.UUID;

/**
 * Matches ActiveMemberResponse in openapi.yaml: one person shown in the room.
 * Public room: the people inside now. Private room: every member; one who is not inside now (closed the
 * app, in another room) has online=false, status AWAY, startedAt null and statusSince = when they left.
 * avatar is that user's stored avatar JSON object as is, or null if they never saved one.
 * seat: their desk seat (0-based), the same on every screen.
 * status / spot / slot / statusSince: what they are doing, the break spot and place (only while on
 * BREAK) and since when.
 */
public record ActiveMemberResponse(UUID userId, String username, RoomRole role, Instant startedAt,
                                   @JsonRawValue String avatar, Integer seat, PresenceStatus status, String spot,
                                   Integer slot, Instant statusSince, boolean online) {

    /** Someone inside now (open session). */
    public static ActiveMemberResponse of(RoomSessionRepository.ActiveSession s) {
        return new ActiveMemberResponse(s.getUserId(), s.getUsername(), s.getRole(), s.getStartedAt(), s.getAvatar(),
                s.getSeat(), s.getStatus(), s.getBreakSpot(), s.getBreakSlot(), s.getStatusSince(), true);
    }

    /** A private room's member: as they are if inside, otherwise away at their seat. */
    public static ActiveMemberResponse of(RoomSessionRepository.MemberPresence m) {
        if (m.getStartedAt() != null) {
            return new ActiveMemberResponse(m.getUserId(), m.getUsername(), m.getRole(), m.getStartedAt(),
                    m.getAvatar(), m.getSeat(), m.getStatus(), m.getBreakSpot(), m.getBreakSlot(),
                    m.getStatusSince(), true);
        }
        Instant awaySince = m.getLastLeftAt() != null ? m.getLastLeftAt() : m.getJoinedAt();
        return new ActiveMemberResponse(m.getUserId(), m.getUsername(), m.getRole(), null, m.getAvatar(),
                m.getSeat(), PresenceStatus.AWAY, null, null, awaySince, false);
    }
}

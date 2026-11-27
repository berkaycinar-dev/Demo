package com.samedesk.backend.room;

import com.fasterxml.jackson.annotation.JsonRawValue;
import java.time.Instant;
import java.util.UUID;

/**
 * Matches ActiveMemberResponse in openapi.yaml: one person who is inside the room right now.
 * avatar is that user's stored avatar JSON object as is, or null if they never saved one.
 */
public record ActiveMemberResponse(UUID userId, String username, RoomRole role, Instant startedAt,
                                   @JsonRawValue String avatar) {

    public static ActiveMemberResponse of(RoomSessionRepository.ActiveSession s) {
        return new ActiveMemberResponse(s.getUserId(), s.getUsername(), s.getRole(), s.getStartedAt(), s.getAvatar());
    }
}

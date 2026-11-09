package com.demo.backend.room;

import java.time.Instant;
import java.util.UUID;

/** Matches ActiveMemberResponse in openapi.yaml: one person who is inside the room right now. */
public record ActiveMemberResponse(UUID userId, String username, RoomRole role, Instant startedAt) {

    static ActiveMemberResponse of(RoomSessionRepository.ActiveSession s) {
        return new ActiveMemberResponse(s.getUserId(), s.getUsername(), s.getRole(), s.getStartedAt());
    }
}

package com.demo.backend.room;

import java.time.Instant;
import java.util.UUID;

/** Matches RoomSessionResponse in openapi.yaml. */
public record RoomSessionResponse(UUID id, UUID roomId, Instant startedAt, Instant lastSeenAt) {

    static RoomSessionResponse of(RoomSession session) {
        return new RoomSessionResponse(session.getId(), session.getRoomId(), session.getStartedAt(),
                session.getLastSeenAt());
    }
}

package com.demo.backend.room;

import java.util.UUID;

/** Payload of the MEMBER_JOINED room event (see the "rooms" tag in openapi.yaml). */
public record MemberJoinedEvent(UUID roomId, UUID userId, String username, RoomRole role) {

    public static final String TYPE = "MEMBER_JOINED";
}

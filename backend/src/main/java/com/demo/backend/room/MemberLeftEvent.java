package com.demo.backend.room;

import java.util.UUID;

/** Payload of the MEMBER_LEFT room event (see the "rooms" tag in openapi.yaml). */
public record MemberLeftEvent(UUID roomId, UUID userId, String username, RoomRole role) {

    public static final String TYPE = "MEMBER_LEFT";
}

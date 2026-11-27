package com.samedesk.backend.room;

import java.util.UUID;

/** Payload of the ROOM_DELETED room event: the owner closed the room; clients inside go back to the lobby. */
public record RoomDeletedEvent(UUID roomId) {

    public static final String TYPE = "ROOM_DELETED";
}

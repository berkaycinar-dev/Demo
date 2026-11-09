package com.demo.backend.room;

import java.time.Instant;
import java.util.UUID;

/** Matches RoomResponse in openapi.yaml. inviteCode is filled only for the OWNER of a private room. */
public record RoomResponse(
        UUID id,
        String name,
        String description,
        RoomVisibility visibility,
        int maxMembers,
        long memberCount,
        UUID ownerId,
        RoomRole myRole,
        String inviteCode,
        Instant createdAt) {

    static RoomResponse of(Room room, long memberCount, RoomRole myRole) {
        String code = myRole == RoomRole.OWNER ? room.getInviteCode() : null;
        return new RoomResponse(room.getId(), room.getName(), room.getDescription(), room.getVisibility(),
                room.getMaxMembers(), memberCount, room.getOwnerId(), myRole, code, room.getCreatedAt());
    }
}

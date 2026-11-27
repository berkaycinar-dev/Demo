package com.samedesk.backend.room;

import java.time.Instant;
import java.util.UUID;

/**
 * Matches RoomResponse in openapi.yaml. inviteCode is filled only for the OWNER of a private room.
 * memberCount: members of a private room (public rooms have none: 0). insideCount: people inside now.
 * myRole: OWNER for the creator, MEMBER for a private room's member, otherwise null.
 */
public record RoomResponse(
        UUID id,
        String name,
        String description,
        RoomVisibility visibility,
        int maxMembers,
        long memberCount,
        long insideCount,
        UUID ownerId,
        RoomRole myRole,
        String inviteCode,
        Instant createdAt) {

    static RoomResponse of(Room room, long memberCount, long insideCount, RoomRole myRole) {
        String code = myRole == RoomRole.OWNER ? room.getInviteCode() : null;
        return new RoomResponse(room.getId(), room.getName(), room.getDescription(), room.getVisibility(),
                room.getMaxMembers(), memberCount, insideCount, room.getOwnerId(), myRole, code, room.getCreatedAt());
    }
}

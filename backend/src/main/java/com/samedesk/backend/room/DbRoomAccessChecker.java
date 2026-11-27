package com.samedesk.backend.room;

import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** RoomAccessChecker backed by the rooms, room_members and room_sessions tables. */
@Component
public class DbRoomAccessChecker implements RoomAccessChecker {

    private final RoomRepository rooms;
    private final RoomMemberRepository members;
    private final RoomSessionRepository sessions;

    public DbRoomAccessChecker(RoomRepository rooms, RoomMemberRepository members, RoomSessionRepository sessions) {
        this.rooms = rooms;
        this.members = members;
        this.sessions = sessions;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isMember(UUID userId, UUID roomId) {
        return members.existsByRoomIdAndUserId(roomId, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canAccess(UUID userId, UUID roomId) {
        return rooms.findById(roomId)
                .map(r -> r.getVisibility() == RoomVisibility.PUBLIC || members.existsByRoomIdAndUserId(roomId, userId))
                .orElse(false);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasActiveSession(UUID userId, UUID roomId) {
        return sessions.existsByRoomIdAndUserIdAndEndedAtIsNull(roomId, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<RoomRole> roleOf(UUID userId, UUID roomId) {
        Optional<RoomRole> member = members.findByRoomIdAndUserId(roomId, userId).map(RoomMember::getRole);
        if (member.isPresent()) {
            return member;
        }
        // public rooms have no members; their creator is still the owner
        return rooms.findById(roomId).filter(r -> r.getOwnerId().equals(userId)).map(r -> RoomRole.OWNER);
    }
}

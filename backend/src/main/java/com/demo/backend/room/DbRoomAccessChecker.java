package com.demo.backend.room;

import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** RoomAccessChecker backed by the room_members and room_sessions tables. */
@Component
public class DbRoomAccessChecker implements RoomAccessChecker {

    private final RoomMemberRepository members;
    private final RoomSessionRepository sessions;

    public DbRoomAccessChecker(RoomMemberRepository members, RoomSessionRepository sessions) {
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
    public boolean hasActiveSession(UUID userId, UUID roomId) {
        return sessions.existsByRoomIdAndUserIdAndEndedAtIsNull(roomId, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<RoomRole> roleOf(UUID userId, UUID roomId) {
        return members.findByRoomIdAndUserId(roomId, userId).map(RoomMember::getRole);
    }
}

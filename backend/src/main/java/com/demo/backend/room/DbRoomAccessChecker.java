package com.demo.backend.room;

import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** RoomAccessChecker backed by the room_members table. */
@Component
public class DbRoomAccessChecker implements RoomAccessChecker {

    private final RoomMemberRepository members;

    public DbRoomAccessChecker(RoomMemberRepository members) {
        this.members = members;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isMember(UUID userId, UUID roomId) {
        return members.existsByRoomIdAndUserId(roomId, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<RoomRole> roleOf(UUID userId, UUID roomId) {
        return members.findByRoomIdAndUserId(roomId, userId).map(RoomMember::getRole);
    }
}

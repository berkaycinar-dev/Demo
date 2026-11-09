package com.demo.backend.room;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoomMemberRepository extends JpaRepository<RoomMember, UUID> {

    Optional<RoomMember> findByRoomIdAndUserId(UUID roomId, UUID userId);

    boolean existsByRoomIdAndUserId(UUID roomId, UUID userId);

    long countByRoomId(UUID roomId);

    List<RoomMember> findByUserIdAndRoomIdIn(UUID userId, Collection<UUID> roomIds);

    /** Member counts for many rooms in one query (avoids one query per room). */
    @Query("select m.roomId as roomId, count(m) as total from RoomMember m where m.roomId in :roomIds group by m.roomId")
    List<RoomCount> countByRoomIds(@Param("roomIds") Collection<UUID> roomIds);

    interface RoomCount {
        UUID getRoomId();

        long getTotal();
    }
}

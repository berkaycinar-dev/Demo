package com.samedesk.backend.room;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Members of private rooms (public rooms have none). */
public interface RoomMemberRepository extends JpaRepository<RoomMember, UUID> {

    Optional<RoomMember> findByRoomIdAndUserId(UUID roomId, UUID userId);

    boolean existsByRoomIdAndUserId(UUID roomId, UUID userId);

    long countByRoomId(UUID roomId);

    /** How many rooms the user joined with this role (MEMBER: other people's private rooms, the limit counts these). */
    long countByUserIdAndRole(UUID userId, RoomRole role);

    List<RoomMember> findByUserIdAndRoomIdIn(UUID userId, Collection<UUID> roomIds);

    @Query("select m.seat from RoomMember m where m.roomId = :roomId")
    List<Integer> findSeats(@Param("roomId") UUID roomId);

    /** Member counts for many rooms in one query (avoids one query per room). */
    @Query("select m.roomId as roomId, count(m) as total from RoomMember m where m.roomId in :roomIds group by m.roomId")
    List<RoomCount> countByRoomIds(@Param("roomIds") Collection<UUID> roomIds);

    interface RoomCount {
        UUID getRoomId();

        long getTotal();
    }
}

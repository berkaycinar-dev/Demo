package com.demo.backend.room;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoomSessionRepository extends JpaRepository<RoomSession, UUID> {

    Optional<RoomSession> findByRoomIdAndUserIdAndEndedAtIsNull(UUID roomId, UUID userId);

    boolean existsByRoomIdAndUserIdAndEndedAtIsNull(UUID roomId, UUID userId);

    /** Rooms where the user is inside right now (open sessions). Used to decide where a user's events go. */
    @Query("select s.roomId from RoomSession s where s.userId = :userId and s.endedAt is null")
    List<UUID> findOpenRoomIds(@Param("userId") UUID userId);

    /** Everyone with an open session in the room, longest-inside first. */
    @Query("""
            select s.userId as userId, u.username as username, m.role as role, s.startedAt as startedAt
            from RoomSession s
            join User u on u.id = s.userId
            join RoomMember m on m.roomId = s.roomId and m.userId = s.userId
            where s.roomId = :roomId and s.endedAt is null
            order by s.startedAt asc
            """)
    List<ActiveSession> findActive(@Param("roomId") UUID roomId);

    /**
     * Closes every open session whose last heartbeat is older than the cutoff.
     * ended_at becomes last_seen_at, so time after the connection dropped is not counted.
     *
     * @return how many sessions were closed
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            update RoomSession s
            set s.endedAt = s.lastSeenAt, s.endReason = :reason
            where s.endedAt is null and s.lastSeenAt < :cutoff
            """)
    int closeStale(@Param("cutoff") Instant cutoff, @Param("reason") SessionEndReason reason);

    interface ActiveSession {
        UUID getUserId();

        String getUsername();

        RoomRole getRole();

        Instant getStartedAt();
    }
}

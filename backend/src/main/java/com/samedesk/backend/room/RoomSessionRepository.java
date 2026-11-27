package com.samedesk.backend.room;

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

    /** The user's most recent finished visit to the room (its seat is offered again on the next enter). */
    Optional<RoomSession> findFirstByRoomIdAndUserIdAndEndedAtIsNotNullOrderByStartedAtDesc(UUID roomId, UUID userId);

    /** Rooms where the user is inside right now (open sessions). Used to decide where a user's events go. */
    @Query("select s.roomId from RoomSession s where s.userId = :userId and s.endedAt is null")
    List<UUID> findOpenRoomIds(@Param("userId") UUID userId);

    /**
     * Was the user inside any room at that moment? True when a session started at or before it
     * and ended at or after it (or is still open). Used to decide whether a finished focus block earns points.
     */
    @Query("""
            select case when count(s) > 0 then true else false end
            from RoomSession s
            where s.userId = :userId and s.startedAt <= :at and (s.endedAt is null or s.endedAt >= :at)
            """)
    boolean existsActiveAt(@Param("userId") UUID userId, @Param("at") Instant at);

    /**
     * Everyone with an open session in the room, longest-inside first (public rooms: these are all the
     * people shown). role: OWNER for the room's creator, otherwise MEMBER.
     */
    @Query("""
            select s.userId as userId, u.username as username,
                   case when r.ownerId = s.userId then com.samedesk.backend.room.RoomRole.OWNER
                        else com.samedesk.backend.room.RoomRole.MEMBER end as role,
                   s.startedAt as startedAt, u.avatar as avatar, s.seat as seat, s.status as status,
                   s.breakSpot as breakSpot, s.breakSlot as breakSlot, s.statusSince as statusSince
            from RoomSession s
            join User u on u.id = s.userId
            join Room r on r.id = s.roomId
            where s.roomId = :roomId and s.endedAt is null
            order by s.startedAt asc
            """)
    List<ActiveSession> findActive(@Param("roomId") UUID roomId);

    /**
     * Every member of a private room, by seat, with their open session if they are inside now
     * (session fields are null when not). lastLeftAt: when their last visit ended (away since).
     */
    @Query("""
            select m.userId as userId, u.username as username, m.role as role, m.seat as seat, u.avatar as avatar,
                   m.joinedAt as joinedAt, s.startedAt as startedAt, s.status as status, s.breakSpot as breakSpot,
                   s.breakSlot as breakSlot, s.statusSince as statusSince,
                   (select max(x.endedAt) from RoomSession x where x.roomId = m.roomId and x.userId = m.userId) as lastLeftAt
            from RoomMember m
            join User u on u.id = m.userId
            left join RoomSession s on s.roomId = m.roomId and s.userId = m.userId and s.endedAt is null
            where m.roomId = :roomId
            order by m.seat asc
            """)
    List<MemberPresence> findMemberPresence(@Param("roomId") UUID roomId);

    /** People inside the room now. */
    long countByRoomIdAndEndedAtIsNull(UUID roomId);

    /** People inside now for many rooms in one query. */
    @Query("""
            select s.roomId as roomId, count(s) as total from RoomSession s
            where s.roomId in :roomIds and s.endedAt is null group by s.roomId
            """)
    List<RoomMemberRepository.RoomCount> countInsideByRoomIds(@Param("roomIds") java.util.Collection<UUID> roomIds);

    /** Desk seats held by the people inside the room now (open sessions only). */
    @Query("select s.seat from RoomSession s where s.roomId = :roomId and s.endedAt is null and s.seat is not null")
    List<Integer> findSeatsTaken(@Param("roomId") UUID roomId);

    /** Places of this break spot that other people in the room hold now (open sessions only). */
    @Query("""
            select s.breakSlot from RoomSession s
            where s.roomId = :roomId and s.endedAt is null and s.userId <> :userId and s.breakSpot = :spot
            """)
    List<Integer> findSlotsTakenByOthers(@Param("roomId") UUID roomId, @Param("userId") UUID userId,
                                         @Param("spot") String spot);

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

        /** Stored avatar JSON, or null. */
        String getAvatar();

        /** Desk seat (0-based); null only for sessions older than V9. */
        Integer getSeat();

        PresenceStatus getStatus();

        /** Break spot id while on BREAK, otherwise null. */
        String getBreakSpot();

        /** Place of the break spot (0-based) while on BREAK, otherwise null. */
        Integer getBreakSlot();

        Instant getStatusSince();
    }

    /** A private room's member and, if inside now, their open session (otherwise those fields are null). */
    interface MemberPresence {
        UUID getUserId();

        String getUsername();

        RoomRole getRole();

        Integer getSeat();

        String getAvatar();

        Instant getJoinedAt();

        Instant getStartedAt();

        PresenceStatus getStatus();

        String getBreakSpot();

        Integer getBreakSlot();

        Instant getStatusSince();

        Instant getLastLeftAt();
    }
}

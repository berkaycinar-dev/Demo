package com.samedesk.backend.room;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoomRepository extends JpaRepository<Room, UUID> {

    List<Room> findByVisibilityOrderByCreatedAtDesc(RoomVisibility visibility);

    boolean existsByInviteCode(String inviteCode);

    Optional<Room> findByInviteCode(String inviteCode);

    /** How many rooms the user created (the limit counts these). */
    long countByOwnerId(UUID ownerId);

    /** "My rooms": the rooms the user created and the private rooms they are a member of, newest first. */
    @Query("""
            select r from Room r
            where r.ownerId = :userId or r.id in (select m.roomId from RoomMember m where m.userId = :userId)
            order by r.createdAt desc
            """)
    List<Room> findMine(@Param("userId") UUID userId);

    /** Locks the room row so two people cannot take the last seat at the same time. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Room r where r.id = :id")
    Optional<Room> findByIdForUpdate(@Param("id") UUID id);
}

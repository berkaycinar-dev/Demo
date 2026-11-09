package com.demo.backend.room;

import com.demo.backend.common.error.BusinessRuleException;
import com.demo.backend.common.error.NotFoundException;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Who is inside a room right now, and for how long: enter, heartbeat, exit, list, and the
 * clean-up of sessions whose connection was lost.
 *
 * Only members can have a session. Joining a room (membership) is RoomService's job.
 */
@Service
public class RoomSessionService {

    static final String SESSION_NOT_FOUND = "SESSION_NOT_FOUND";
    static final String NOT_A_MEMBER = "NOT_A_MEMBER";

    private final RoomRepository rooms;
    private final RoomMemberRepository members;
    private final RoomSessionRepository sessions;
    private final Clock clock;

    public RoomSessionService(RoomRepository rooms, RoomMemberRepository members,
                              RoomSessionRepository sessions, Clock clock) {
        this.rooms = rooms;
        this.members = members;
        this.sessions = sessions;
        this.clock = clock;
    }

    /**
     * Opens a session. If the caller already has an open one, it is kept and refreshed
     * (a page reload must not create a second row). The room row is locked so two requests
     * of the same user cannot both insert.
     */
    @Transactional
    public RoomSessionResponse enter(UUID userId, UUID roomId) {
        Room room = rooms.findByIdForUpdate(roomId).orElseThrow(RoomSessionService::roomNotFound);
        requireMember(room, userId);

        Instant now = clock.instant();
        RoomSession session = sessions.findByRoomIdAndUserIdAndEndedAtIsNull(roomId, userId).orElse(null);
        if (session == null) {
            session = sessions.save(new RoomSession(roomId, userId, now));
        } else {
            session.touch(now);
        }
        return RoomSessionResponse.of(session);
    }

    /** Keeps the open session alive. 404 SESSION_NOT_FOUND if there is none (it may have timed out). */
    @Transactional
    public void heartbeat(UUID userId, UUID roomId) {
        RoomSession session = sessions.findByRoomIdAndUserIdAndEndedAtIsNull(roomId, userId)
                .orElseThrow(() -> new NotFoundException(SESSION_NOT_FOUND, "No open session in this room."));
        session.touch(clock.instant());
    }

    /** Closes the open session. Calling it with no open session does nothing. */
    @Transactional
    public void exit(UUID userId, UUID roomId) {
        sessions.findByRoomIdAndUserIdAndEndedAtIsNull(roomId, userId)
                .ifPresent(s -> s.end(SessionEndReason.EXIT, clock.instant()));
    }

    /** People inside the room now. Members only. */
    @Transactional(readOnly = true)
    public List<ActiveMemberResponse> active(UUID userId, UUID roomId) {
        Room room = rooms.findById(roomId).orElseThrow(RoomSessionService::roomNotFound);
        requireMember(room, userId);
        return sessions.findActive(roomId).stream().map(ActiveMemberResponse::of).toList();
    }

    /**
     * Closes sessions whose last heartbeat is older than the cutoff (reason TIMEOUT).
     * Called by RoomSessionSweeper.
     *
     * @return how many sessions were closed
     */
    @Transactional
    public int closeStale(Instant cutoff) {
        return sessions.closeStale(cutoff, SessionEndReason.TIMEOUT);
    }

    /** Private rooms look like they do not exist to non-members; public rooms say "join first". */
    private void requireMember(Room room, UUID userId) {
        if (members.existsByRoomIdAndUserId(room.getId(), userId)) {
            return;
        }
        if (room.getVisibility() == RoomVisibility.PRIVATE) {
            throw roomNotFound();
        }
        throw new BusinessRuleException(NOT_A_MEMBER, "Join the room before entering it.");
    }

    private static NotFoundException roomNotFound() {
        return new NotFoundException(RoomService.ROOM_NOT_FOUND, "Room not found.");
    }
}

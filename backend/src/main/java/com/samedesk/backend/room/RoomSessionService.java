package com.samedesk.backend.room;

import com.samedesk.backend.common.error.BusinessRuleException;
import com.samedesk.backend.common.error.NotFoundException;
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
    static final String SPOT_TAKEN = "SPOT_TAKEN";
    /** Most break spots have two places (frontend AvatarCrowd); used when the client does not say. */
    static final int DEFAULT_SPOT_CAPACITY = 2;

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
            // back in the room (left, or the connection dropped and timed out): the seat of the last visit
            // if it is still free, so people do not change desks; otherwise the lowest free one
            Integer previous = sessions.findFirstByRoomIdAndUserIdAndEndedAtIsNotNullOrderByStartedAtDesc(roomId, userId)
                    .map(RoomSession::getSeat).orElse(null);
            List<Integer> taken = sessions.findSeatsTaken(roomId);
            session = new RoomSession(roomId, userId, now);
            session.takeSeat(previous != null && !taken.contains(previous) ? previous : freeSeat(taken));
            session = sessions.save(session);
        } else {
            session.touch(now);
            if (session.getSeat() == null) {
                // opened before seats existed: give one now
                session.takeSeat(freeSeat(sessions.findSeatsTaken(roomId)));
            }
        }
        return RoomSessionResponse.of(session);
    }

    /**
     * Lowest desk seat nobody inside holds. Only members can be inside and a room has at most
     * maxMembers members, so the result is always below maxMembers.
     */
    static int freeSeat(List<Integer> taken) {
        int seat = 0;
        while (taken.contains(seat)) {
            seat++;
        }
        return seat;
    }

    /** Keeps the open session alive. 404 SESSION_NOT_FOUND if there is none (it may have timed out). */
    @Transactional
    public void heartbeat(UUID userId, UUID roomId) {
        RoomSession session = sessions.findByRoomIdAndUserIdAndEndedAtIsNull(roomId, userId)
                .orElseThrow(() -> new NotFoundException(SESSION_NOT_FOUND, "No open session in this room."));
        session.touch(clock.instant());
    }

    /**
     * Sets what the caller is doing in the room (IDLE, FOCUS, BREAK, AWAY) and, on a break, at which
     * spot and place. The server hands out the places of a spot (the one asked for if free, otherwise
     * the lowest free one), so every screen shows each person in the same place. If the others already
     * fill the spot, 409 SPOT_TAKEN and nothing changes (the client picks another spot). The room row is
     * locked while counting, so two people who pick the same place at the same moment are handled one
     * after the other. 404 SESSION_NOT_FOUND without an open session. Counts as a heartbeat.
     */
    @Transactional
    public SessionStatusResponse changeStatus(UUID userId, UUID roomId, ChangeStatusRequest request) {
        rooms.findByIdForUpdate(roomId).orElseThrow(RoomSessionService::roomNotFound);
        RoomSession session = sessions.findByRoomIdAndUserIdAndEndedAtIsNull(roomId, userId)
                .orElseThrow(() -> new NotFoundException(SESSION_NOT_FOUND, "No open session in this room."));

        String spot = request.status() == PresenceStatus.BREAK ? request.spot() : null;
        Integer slot = null;
        if (spot != null) {
            int capacity = request.spotCapacity() != null ? request.spotCapacity() : DEFAULT_SPOT_CAPACITY;
            slot = freePlace(sessions.findSlotsTakenByOthers(roomId, userId, spot), capacity, request.slot());
        }
        session.changeStatus(request.status(), spot, slot, clock.instant());
        return SessionStatusResponse.of(session);
    }

    /** The preferred place if it is free, otherwise the lowest free one; SPOT_TAKEN when none is left. */
    static int freePlace(List<Integer> taken, int capacity, Integer preferred) {
        if (preferred != null && preferred < capacity && !taken.contains(preferred)) {
            return preferred;
        }
        for (int i = 0; i < capacity; i++) {
            if (!taken.contains(i)) {
                return i;
            }
        }
        throw new BusinessRuleException(SPOT_TAKEN, "This break spot is full. Pick another one.");
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

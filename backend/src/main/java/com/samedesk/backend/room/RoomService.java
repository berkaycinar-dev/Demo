package com.samedesk.backend.room;

import com.samedesk.backend.common.error.BusinessRuleException;
import com.samedesk.backend.common.error.NotFoundException;
import com.samedesk.backend.common.error.UnauthorizedException;
import com.samedesk.backend.realtime.AfterCommit;
import com.samedesk.backend.realtime.RoomEventPublisher;
import com.samedesk.backend.user.User;
import com.samedesk.backend.user.UserRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Clock;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Business rules for rooms: create, list, read, join, leave and delete.
 *
 * Public rooms have no members: anyone enters while there is a free seat, works and leaves
 * (RoomSessionService). Private (invite) rooms keep members: you join once with the invite code and stay
 * a member (shown as away when not inside) until you leave. Limits: a user creates at most
 * {@link #MAX_OWNED_ROOMS} rooms and is a member of at most {@link #MAX_JOINED_ROOMS} other people's
 * private rooms; past them the request is refused and the client asks to delete or leave a room.
 */
@Service
public class RoomService {

    static final int DEFAULT_MAX_MEMBERS = 8;
    static final String ROOM_NOT_FOUND = "ROOM_NOT_FOUND";
    public static final int MAX_OWNED_ROOMS = 3;
    public static final int MAX_JOINED_ROOMS = 5;

    /** No 0/O/1/I so a code read aloud or typed by hand is harder to get wrong. */
    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 8;

    private final RoomRepository rooms;
    private final RoomMemberRepository members;
    private final RoomSessionRepository sessions;
    private final UserRepository users;
    private final RoomEventPublisher events;
    private final Clock clock;
    private final SecureRandom random = new SecureRandom();

    public RoomService(RoomRepository rooms, RoomMemberRepository members, RoomSessionRepository sessions,
                       UserRepository users, RoomEventPublisher events, Clock clock) {
        this.rooms = rooms;
        this.members = members;
        this.sessions = sessions;
        this.users = users;
        this.events = events;
        this.clock = clock;
    }

    /**
     * The caller becomes the OWNER. A private room also gets the owner as its first member (seat 0).
     * 409 ROOM_LIMIT when the caller already created MAX_OWNED_ROOMS rooms.
     */
    @Transactional
    public RoomResponse create(UUID userId, CreateRoomRequest request) {
        String name = request.name().trim();
        if (name.isEmpty()) {
            throw new BusinessRuleException("ROOM_NAME_BLANK", "Room name must not be blank.");
        }
        if (rooms.countByOwnerId(userId) >= MAX_OWNED_ROOMS) {
            throw new BusinessRuleException("ROOM_LIMIT",
                    "You can create at most " + MAX_OWNED_ROOMS + " rooms. Delete one to create a new one.");
        }
        RoomVisibility visibility = request.visibility() != null ? request.visibility() : RoomVisibility.PUBLIC;
        int maxMembers = request.maxMembers() != null ? request.maxMembers() : DEFAULT_MAX_MEMBERS;
        String inviteCode = visibility == RoomVisibility.PRIVATE ? newInviteCode() : null;

        Room room = rooms.saveAndFlush(new Room(name, request.description(), visibility, inviteCode,
                maxMembers, userId, clock.instant()));
        long memberCount = 0;
        if (visibility == RoomVisibility.PRIVATE) {
            members.save(new RoomMember(room.getId(), userId, RoomRole.OWNER, clock.instant(), 0));
            memberCount = 1;
        }
        return RoomResponse.of(room, memberCount, 0, RoomRole.OWNER);
    }

    /** PUBLIC: all public rooms. MINE: rooms the caller created and private rooms they are a member of. */
    @Transactional(readOnly = true)
    public List<RoomResponse> list(UUID userId, RoomScope scope) {
        List<Room> found = scope == RoomScope.MINE
                ? rooms.findMine(userId)
                : rooms.findByVisibilityOrderByCreatedAtDesc(RoomVisibility.PUBLIC);
        if (found.isEmpty()) {
            return List.of();
        }
        Set<UUID> ids = found.stream().map(Room::getId).collect(Collectors.toSet());

        Map<UUID, Long> memberCounts = new HashMap<>();
        members.countByRoomIds(ids).forEach(c -> memberCounts.put(c.getRoomId(), c.getTotal()));
        Map<UUID, Long> inside = new HashMap<>();
        sessions.countInsideByRoomIds(ids).forEach(c -> inside.put(c.getRoomId(), c.getTotal()));
        Map<UUID, RoomRole> myRoles = new HashMap<>();
        members.findByUserIdAndRoomIdIn(userId, ids).forEach(m -> myRoles.put(m.getRoomId(), m.getRole()));

        return found.stream()
                .map(r -> RoomResponse.of(r, memberCounts.getOrDefault(r.getId(), 0L), inside.getOrDefault(r.getId(), 0L),
                        roleOf(r, userId, myRoles.get(r.getId()))))
                .toList();
    }

    /** Private rooms look like they do not exist to people who are not members. */
    @Transactional(readOnly = true)
    public RoomResponse get(UUID userId, UUID roomId) {
        Room room = rooms.findById(roomId).orElseThrow(RoomService::notFound);
        RoomRole member = members.findByRoomIdAndUserId(roomId, userId).map(RoomMember::getRole).orElse(null);
        if (room.getVisibility() == RoomVisibility.PRIVATE && member == null) {
            throw notFound();
        }
        return RoomResponse.of(room, members.countByRoomId(roomId), sessions.countByRoomIdAndEndedAtIsNull(roomId),
                roleOf(room, userId, member));
    }

    /**
     * Public room: nothing to join (there are no members), the room is returned as is; entering it is
     * RoomSessionService.enter. Private room: adds the caller as a MEMBER with a desk seat. Joining a room
     * you already belong to changes nothing. A wrong invite code gives ROOM_NOT_FOUND, a full room
     * ROOM_FULL, MAX_JOINED_ROOMS reached JOIN_LIMIT. The room row is locked while counting, so the
     * last seat cannot be taken twice.
     */
    @Transactional
    public RoomResponse join(UUID userId, UUID roomId, String inviteCode) {
        Room room = rooms.findByIdForUpdate(roomId).orElseThrow(RoomService::notFound);
        if (room.getVisibility() == RoomVisibility.PUBLIC) {
            return RoomResponse.of(room, 0, sessions.countByRoomIdAndEndedAtIsNull(roomId), roleOf(room, userId, null));
        }

        RoomMember existing = members.findByRoomIdAndUserId(roomId, userId).orElse(null);
        if (existing != null) {
            return RoomResponse.of(room, members.countByRoomId(roomId), sessions.countByRoomIdAndEndedAtIsNull(roomId),
                    existing.getRole());
        }
        if (!inviteCodeMatches(room.getInviteCode(), inviteCode)) {
            throw notFound(); // same answer as an unknown room: ids cannot be probed
        }
        long count = members.countByRoomId(roomId);
        if (count >= room.getMaxMembers()) {
            throw new BusinessRuleException("ROOM_FULL", "Room is full.");
        }
        if (members.countByUserIdAndRole(userId, RoomRole.MEMBER) >= MAX_JOINED_ROOMS) {
            throw new BusinessRuleException("JOIN_LIMIT",
                    "You can be in at most " + MAX_JOINED_ROOMS + " invite rooms. Leave one to join a new one.");
        }

        User user = users.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("UNAUTHENTICATED", "Account no longer exists."));
        int seat = RoomSessionService.freeSeat(members.findSeats(roomId));
        members.save(new RoomMember(roomId, userId, RoomRole.MEMBER, clock.instant(), seat));
        // After the commit, so clients never hear about a join that was rolled back.
        MemberJoinedEvent event = new MemberJoinedEvent(roomId, userId, user.getUsername(), RoomRole.MEMBER);
        AfterCommit.run(() -> events.publish(roomId.toString(), MemberJoinedEvent.TYPE, event));
        return RoomResponse.of(room, count + 1, sessions.countByRoomIdAndEndedAtIsNull(roomId), RoomRole.MEMBER);
    }

    /**
     * Joins the private room the invite code belongs to. Same rules as {@link #join}. An unknown code gives
     * ROOM_NOT_FOUND. Case and spaces are forgiven (codes are typed by hand). Public rooms have no code.
     */
    @Transactional
    public RoomResponse joinByCode(UUID userId, String inviteCode) {
        String code = normalizeCode(inviteCode);
        Room room = rooms.findByInviteCode(code).orElseThrow(RoomService::notFound);
        return join(userId, room.getId(), code);
    }

    /**
     * Gives up membership of a private room: the open session (if any) ends with LEFT_ROOM and MEMBER_LEFT
     * is published. The OWNER cannot leave (409 OWNER_CANNOT_LEAVE; they delete the room instead).
     * Public rooms have no membership: nothing changes. Leaving a private room you are not in looks like
     * the room does not exist.
     */
    @Transactional
    public void leave(UUID userId, UUID roomId) {
        Room room = rooms.findByIdForUpdate(roomId).orElseThrow(RoomService::notFound);
        if (room.getVisibility() == RoomVisibility.PUBLIC) {
            return;
        }
        RoomMember member = members.findByRoomIdAndUserId(roomId, userId).orElseThrow(RoomService::notFound);
        if (member.getRole() == RoomRole.OWNER) {
            throw new BusinessRuleException("OWNER_CANNOT_LEAVE", "The owner cannot leave the room. Delete it instead.");
        }

        User user = users.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("UNAUTHENTICATED", "Account no longer exists."));
        sessions.findByRoomIdAndUserIdAndEndedAtIsNull(roomId, userId)
                .ifPresent(s -> s.end(SessionEndReason.LEFT_ROOM, clock.instant()));
        members.delete(member);

        MemberLeftEvent event = new MemberLeftEvent(roomId, userId, user.getUsername(), member.getRole());
        AfterCommit.run(() -> events.publish(roomId.toString(), MemberLeftEvent.TYPE, event));
    }

    /**
     * Deletes the room with its members and visits. Only the owner can (409 NOT_ROOM_OWNER); for a
     * non-member a private room looks like it does not exist. ROOM_DELETED is published after the commit,
     * so people inside go back to the lobby.
     */
    @Transactional
    public void delete(UUID userId, UUID roomId) {
        Room room = rooms.findByIdForUpdate(roomId).orElseThrow(RoomService::notFound);
        if (!room.getOwnerId().equals(userId)) {
            if (room.getVisibility() == RoomVisibility.PRIVATE && !members.existsByRoomIdAndUserId(roomId, userId)) {
                throw notFound();
            }
            throw new BusinessRuleException("NOT_ROOM_OWNER", "Only the owner can delete the room.");
        }
        rooms.delete(room); // members and sessions go with it (ON DELETE CASCADE)
        RoomDeletedEvent event = new RoomDeletedEvent(roomId);
        AfterCommit.run(() -> events.publish(roomId.toString(), RoomDeletedEvent.TYPE, event));
    }

    /** OWNER for the creator, MEMBER for a private room's member, otherwise null. */
    private static RoomRole roleOf(Room room, UUID userId, RoomRole membership) {
        if (room.getOwnerId().equals(userId)) {
            return RoomRole.OWNER;
        }
        return membership;
    }

    private String newInviteCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder(CODE_LENGTH);
            for (int i = 0; i < CODE_LENGTH; i++) {
                sb.append(CODE_ALPHABET.charAt(random.nextInt(CODE_ALPHABET.length())));
            }
            code = sb.toString();
        } while (rooms.existsByInviteCode(code));
        return code;
    }

    private static boolean inviteCodeMatches(String expected, String given) {
        if (expected == null || given == null) {
            return false;
        }
        // Constant-time compare, so response time does not leak how much of the code was right.
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                normalizeCode(given).getBytes(StandardCharsets.UTF_8));
    }

    /** Spaces removed, upper case. Locale.ROOT: on a Turkish JVM "i" must not become "İ". */
    static String normalizeCode(String code) {
        return code == null ? "" : code.replaceAll("\\s+", "").toUpperCase(Locale.ROOT);
    }

    private static NotFoundException notFound() {
        return new NotFoundException(ROOM_NOT_FOUND, "Room not found.");
    }
}

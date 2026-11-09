package com.demo.backend.room;

import com.demo.backend.common.error.BusinessRuleException;
import com.demo.backend.common.error.NotFoundException;
import com.demo.backend.common.error.UnauthorizedException;
import com.demo.backend.realtime.RoomEventPublisher;
import com.demo.backend.user.User;
import com.demo.backend.user.UserRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Clock;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Business rules for rooms: create, list, read and join. */
@Service
public class RoomService {

    static final int DEFAULT_MAX_MEMBERS = 8;
    static final String ROOM_NOT_FOUND = "ROOM_NOT_FOUND";

    /** No 0/O/1/I so a code read aloud or typed by hand is harder to get wrong. */
    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 8;

    private final RoomRepository rooms;
    private final RoomMemberRepository members;
    private final UserRepository users;
    private final RoomEventPublisher events;
    private final Clock clock;
    private final SecureRandom random = new SecureRandom();

    public RoomService(RoomRepository rooms, RoomMemberRepository members, UserRepository users,
                       RoomEventPublisher events, Clock clock) {
        this.rooms = rooms;
        this.members = members;
        this.users = users;
        this.events = events;
        this.clock = clock;
    }

    /** The caller becomes the OWNER and the first member. */
    @Transactional
    public RoomResponse create(UUID userId, CreateRoomRequest request) {
        String name = request.name().trim();
        if (name.isEmpty()) {
            throw new BusinessRuleException("ROOM_NAME_BLANK", "Room name must not be blank.");
        }
        RoomVisibility visibility = request.visibility() != null ? request.visibility() : RoomVisibility.PUBLIC;
        int maxMembers = request.maxMembers() != null ? request.maxMembers() : DEFAULT_MAX_MEMBERS;
        String inviteCode = visibility == RoomVisibility.PRIVATE ? newInviteCode() : null;

        Room room = rooms.saveAndFlush(new Room(name, request.description(), visibility, inviteCode,
                maxMembers, userId, clock.instant()));
        members.save(new RoomMember(room.getId(), userId, RoomRole.OWNER, clock.instant()));
        return RoomResponse.of(room, 1, RoomRole.OWNER);
    }

    @Transactional(readOnly = true)
    public List<RoomResponse> list(UUID userId, RoomScope scope) {
        List<Room> found = scope == RoomScope.MINE
                ? rooms.findJoinedBy(userId)
                : rooms.findByVisibilityOrderByCreatedAtDesc(RoomVisibility.PUBLIC);
        if (found.isEmpty()) {
            return List.of();
        }
        Set<UUID> ids = found.stream().map(Room::getId).collect(Collectors.toSet());

        Map<UUID, Long> counts = new HashMap<>();
        members.countByRoomIds(ids).forEach(c -> counts.put(c.getRoomId(), c.getTotal()));
        Map<UUID, RoomRole> myRoles = new HashMap<>();
        members.findByUserIdAndRoomIdIn(userId, ids).forEach(m -> myRoles.put(m.getRoomId(), m.getRole()));

        return found.stream()
                .map(r -> RoomResponse.of(r, counts.getOrDefault(r.getId(), 0L), myRoles.get(r.getId())))
                .toList();
    }

    /** Private rooms look like they do not exist to people who are not members. */
    @Transactional(readOnly = true)
    public RoomResponse get(UUID userId, UUID roomId) {
        Room room = rooms.findById(roomId).orElseThrow(RoomService::notFound);
        RoomRole role = members.findByRoomIdAndUserId(roomId, userId).map(RoomMember::getRole).orElse(null);
        if (room.getVisibility() == RoomVisibility.PRIVATE && role == null) {
            throw notFound();
        }
        return RoomResponse.of(room, members.countByRoomId(roomId), role);
    }

    /**
     * Adds the caller as a MEMBER. Joining a room you already belong to changes nothing.
     * The room row is locked while we count, so the last seat cannot be taken twice.
     */
    @Transactional
    public RoomResponse join(UUID userId, UUID roomId, String inviteCode) {
        Room room = rooms.findByIdForUpdate(roomId).orElseThrow(RoomService::notFound);

        RoomMember existing = members.findByRoomIdAndUserId(roomId, userId).orElse(null);
        if (existing != null) {
            return RoomResponse.of(room, members.countByRoomId(roomId), existing.getRole());
        }
        if (room.getVisibility() == RoomVisibility.PRIVATE && !inviteCodeMatches(room.getInviteCode(), inviteCode)) {
            throw notFound(); // same answer as an unknown room: ids cannot be probed
        }
        long count = members.countByRoomId(roomId);
        if (count >= room.getMaxMembers()) {
            throw new BusinessRuleException("ROOM_FULL", "Room is full.");
        }

        User user = users.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("UNAUTHENTICATED", "Account no longer exists."));
        members.save(new RoomMember(roomId, userId, RoomRole.MEMBER, clock.instant()));
        events.publish(roomId.toString(), MemberJoinedEvent.TYPE,
                new MemberJoinedEvent(roomId, userId, user.getUsername(), RoomRole.MEMBER));
        return RoomResponse.of(room, count + 1, RoomRole.MEMBER);
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
                given.trim().toUpperCase().getBytes(StandardCharsets.UTF_8));
    }

    private static NotFoundException notFound() {
        return new NotFoundException(ROOM_NOT_FOUND, "Room not found.");
    }
}

package com.demo.backend.room;

import java.util.Optional;
import java.util.UUID;

/**
 * Answers "may this user act in this room?". This is the only place that knows how
 * membership is stored. D's STOMP interceptor calls it on SUBSCRIBE and SEND;
 * REST services call it too, so both doors use the same rule.
 *
 * Roles are read from the database every time (they are not in the JWT).
 */
public interface RoomAccessChecker {

    boolean isMember(UUID userId, UUID roomId);

    /** True while the user has an open session in the room (entered and not yet exited or timed out). */
    boolean hasActiveSession(UUID userId, UUID roomId);

    /** The user's role in the room, or empty if the user is not a member. */
    Optional<RoomRole> roleOf(UUID userId, UUID roomId);
}

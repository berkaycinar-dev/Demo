package com.demo.backend.realtime;

import com.demo.backend.room.RoomAccessChecker;
import java.security.Principal;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.regex.Pattern;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageType;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
class StompRoomAccess implements ChannelInterceptor {

    private static final String ROOM_PREFIX = "/topic/rooms/";
    private static final String EVENT_SUFFIX = "/events";
    private static final Pattern ROOM_EVENTS = Pattern.compile(ROOM_PREFIX
            + "([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})" + EVENT_SUFFIX);

    private final JwtDecoder jwtDecoder;
    private final RoomAccessChecker rooms;
    private final Clock clock;
    private final ConcurrentMap<String, SessionIdentity> sessions = new ConcurrentHashMap<>();

    StompRoomAccess(JwtDecoder jwtDecoder, RoomAccessChecker rooms, Clock clock) {
        this.jwtDecoder = jwtDecoder;
        this.rooms = rooms;
        this.clock = clock;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor frame = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (frame == null || frame.getCommand() == null) {
            return message;
        }

        switch (frame.getCommand()) {
            case CONNECT, STOMP -> connect(frame);
            case DISCONNECT -> { }
            case SUBSCRIBE -> {
                SessionIdentity identity = requireIdentity(frame.getSessionId());
                if (!mayReceive(identity, frame.getDestination())) {
                    throw new AccessDeniedException("FORBIDDEN");
                }
            }
            case UNSUBSCRIBE -> requireIdentity(frame.getSessionId());
            default -> {
                requireIdentity(frame.getSessionId());
                throw new AccessDeniedException("FORBIDDEN");
            }
        }
        return message;
    }

    private void connect(StompHeaderAccessor frame) {
        List<String> authorization = frame.removeNativeHeader(HttpHeaders.AUTHORIZATION);
        if (authorization == null || authorization.size() != 1
                || !authorization.getFirst().startsWith("Bearer ") || authorization.getFirst().length() == 7) {
            throw unauthenticated();
        }

        SessionIdentity identity;
        try {
            Jwt jwt = jwtDecoder.decode(authorization.getFirst().substring(7));
            if (jwt.getSubject() == null || jwt.getExpiresAt() == null) {
                throw unauthenticated();
            }
            identity = new SessionIdentity(UUID.fromString(jwt.getSubject()), jwt.getExpiresAt());
        } catch (JwtException | IllegalArgumentException ex) {
            throw unauthenticated();
        }

        String sessionId = frame.getSessionId();
        if (sessionId == null || !identity.expiresAt().isAfter(clock.instant())
                || sessions.putIfAbsent(sessionId, identity) != null) {
            throw unauthenticated();
        }
        frame.setUser(identity);
    }

    private SessionIdentity requireIdentity(String sessionId) {
        SessionIdentity identity = sessionId == null ? null : sessions.get(sessionId);
        if (identity == null || !identity.expiresAt().isAfter(clock.instant())) {
            throw unauthenticated();
        }
        return identity;
    }

    Message<?> authorizeDelivery(Message<?> message) {
        if (SimpMessageHeaderAccessor.getMessageType(message.getHeaders()) != SimpMessageType.MESSAGE) {
            return message;
        }
        String sessionId = SimpMessageHeaderAccessor.getSessionId(message.getHeaders());
        SessionIdentity identity = sessionId == null ? null : sessions.get(sessionId);
        String destination = SimpMessageHeaderAccessor.getDestination(message.getHeaders());
        // Check the receiving session again. A subscription can outlive a token or membership.
        return identity != null && identity.expiresAt().isAfter(clock.instant())
                && mayReceive(identity, destination) ? message : null;
    }

    private boolean mayReceive(SessionIdentity identity, String destination) {
        if (destination == null) {
            return false;
        }
        var match = ROOM_EVENTS.matcher(destination);
        return match.matches() && rooms.isMember(identity.userId(), UUID.fromString(match.group(1)));
    }

    static String eventDestination(UUID roomId) {
        return ROOM_PREFIX + roomId + EVENT_SUFFIX;
    }

    @EventListener
    void disconnected(SessionDisconnectEvent event) {
        sessions.remove(event.getSessionId());
    }

    private static BadCredentialsException unauthenticated() {
        return new BadCredentialsException("UNAUTHENTICATED");
    }

    private record SessionIdentity(UUID userId, Instant expiresAt) implements Principal {
        @Override
        public String getName() {
            return userId.toString();
        }
    }
}

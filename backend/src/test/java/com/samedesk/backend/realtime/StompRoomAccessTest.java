package com.samedesk.backend.realtime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.samedesk.backend.room.RoomAccessChecker;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageType;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.access.AccessDeniedException;

class StompRoomAccessTest {

    private static final String SESSION_ID = "existing-connection";
    private static final Instant NOW = Instant.parse("2026-11-09T12:00:00Z");
    private static final Instant EXPIRY = NOW.plusSeconds(900);
    private static final UUID USER_ID = UUID.randomUUID();
    private static final UUID ROOM_ID = UUID.randomUUID();

    private final Clock clock = mock(Clock.class);
    private final RoomAccessChecker rooms = mock(RoomAccessChecker.class);
    private final JwtDecoder jwtDecoder = mock(JwtDecoder.class);
    private final StompRoomAccess access = new StompRoomAccess(jwtDecoder, rooms, clock);

    @BeforeEach
    void subscribeAsMember() {
        when(clock.instant()).thenReturn(NOW);
        when(rooms.canAccess(USER_ID, ROOM_ID)).thenReturn(true);
        when(jwtDecoder.decode("test-token")).thenReturn(Jwt.withTokenValue("test-token")
                .header("alg", "HS256").subject(USER_ID.toString()).expiresAt(EXPIRY).build());

        StompHeaderAccessor connect = StompHeaderAccessor.create(StompCommand.CONNECT);
        connect.setSessionId(SESSION_ID);
        connect.setNativeHeader("Authorization", "Bearer test-token");
        connect.setLeaveMutable(true);
        access.preSend(MessageBuilder.createMessage(new byte[0], connect.getMessageHeaders()), null);
        assertThat(connect.getNativeHeader("Authorization")).isNull();

        StompHeaderAccessor subscribe = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        subscribe.setSessionId(SESSION_ID);
        subscribe.setDestination(StompRoomAccess.eventDestination(ROOM_ID));
        access.preSend(MessageBuilder.createMessage(new byte[0], subscribe.getMessageHeaders()), null);
    }

    @Test
    void stopsDeliveryOnExistingSubscriptionWhenTokenExpires() {
        Message<?> event = roomEvent();
        assertThat(access.authorizeDelivery(event)).isSameAs(event);

        when(clock.instant()).thenReturn(EXPIRY);

        assertThat(access.authorizeDelivery(event)).isNull();
    }

    @Test
    void stopsDeliveryOnExistingSubscriptionWhenMembershipIsRevoked() {
        Message<?> event = roomEvent();
        assertThat(access.authorizeDelivery(event)).isSameAs(event);

        when(rooms.canAccess(USER_ID, ROOM_ID)).thenReturn(false);

        assertThat(access.authorizeDelivery(event)).isNull();
    }

    @Test
    void presenceDeliveryChecksTokenAndCurrentMembership() {
        SimpMessageHeaderAccessor headers = SimpMessageHeaderAccessor.create(SimpMessageType.MESSAGE);
        headers.setSessionId(SESSION_ID);
        headers.setDestination(StompRoomAccess.presenceDestination(ROOM_ID));
        Message<?> snapshot = MessageBuilder.createMessage(new byte[0], headers.getMessageHeaders());
        assertThat(access.authorizeDelivery(snapshot)).isSameAs(snapshot);

        when(rooms.canAccess(USER_ID, ROOM_ID)).thenReturn(false);
        assertThat(access.authorizeDelivery(snapshot)).isNull();

        when(rooms.canAccess(USER_ID, ROOM_ID)).thenReturn(true);
        when(clock.instant()).thenReturn(EXPIRY);
        assertThat(access.authorizeDelivery(snapshot)).isNull();
    }

    @Test
    void personalTimerSubscriptionNeedsNoRoomMembership() {
        when(rooms.canAccess(USER_ID, ROOM_ID)).thenReturn(false);
        subscribe("/user/queue/timers");
        Message<?> event = timerEvent(SESSION_ID, "/user/queue/timers");
        assertThat(access.authorizeDelivery(event)).isSameAs(event);

        when(clock.instant()).thenReturn(EXPIRY);
        assertThat(access.authorizeDelivery(event)).isNull();
    }

    @Test
    void rejectsRawQueuesUserIdsWildcardsAndOtherPersonalChannels() {
        for (String destination : new String[] {"/queue/timers", "/queue/timers-user" + SESSION_ID,
                "/user/" + USER_ID + "/queue/timers", "/user/queue/**", "/user/queue/notifications"}) {
            assertThatThrownBy(() -> subscribe(destination)).isInstanceOf(AccessDeniedException.class);
        }
    }

    @Test
    void personalDeliveryRequiresTheReceivingSessionsQueueAndOriginalDestination() {
        assertThat(access.authorizeDelivery(timerEvent("another-session", "/user/queue/timers"))).isNull();
        assertThat(access.authorizeDelivery(timerEvent(SESSION_ID, null))).isNull();
        assertThat(access.authorizeDelivery(timerEvent(SESSION_ID, "/user/queue/notifications"))).isNull();
    }

    private void subscribe(String destination) {
        StompHeaderAccessor frame = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        frame.setSessionId(SESSION_ID);
        frame.setDestination(destination);
        access.preSend(MessageBuilder.createMessage(new byte[0], frame.getMessageHeaders()), null);
    }

    private Message<?> timerEvent(String queueSession, String originalDestination) {
        SimpMessageHeaderAccessor headers = SimpMessageHeaderAccessor.create(SimpMessageType.MESSAGE);
        headers.setSessionId(SESSION_ID);
        headers.setDestination("/queue/timers-user" + queueSession);
        headers.setNativeHeader(SimpMessageHeaderAccessor.ORIGINAL_DESTINATION, originalDestination);
        return MessageBuilder.createMessage(new byte[0], headers.getMessageHeaders());
    }

    private Message<?> roomEvent() {
        SimpMessageHeaderAccessor headers = SimpMessageHeaderAccessor.create(SimpMessageType.MESSAGE);
        headers.setSessionId(SESSION_ID);
        headers.setDestination(StompRoomAccess.eventDestination(ROOM_ID));
        return MessageBuilder.createMessage(new byte[0], headers.getMessageHeaders());
    }
}

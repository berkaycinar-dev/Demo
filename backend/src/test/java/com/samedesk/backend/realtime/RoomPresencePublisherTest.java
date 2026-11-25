package com.samedesk.backend.realtime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.assertj.core.api.Assertions.assertThat;

import com.samedesk.backend.room.RoomSessionRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.user.SimpSubscription;
import org.springframework.messaging.simp.user.SimpUserRegistry;

class RoomPresencePublisherTest {

    private final SimpUserRegistry users = mock(SimpUserRegistry.class);
    private final RoomSessionRepository sessions = mock(RoomSessionRepository.class);
    private final SimpMessagingTemplate messaging = mock(SimpMessagingTemplate.class);
    private final RoomPresencePublisher publisher = new RoomPresencePublisher(users, sessions, messaging,
            Clock.fixed(Instant.parse("2026-11-25T12:00:00Z"), ZoneOffset.UTC));

    @Test
    void sendsAnEmptySnapshotWhenTheLastSessionEndsAndQueriesEachRoomOnce() {
        UUID roomId = UUID.randomUUID();
        String destination = StompRoomAccess.presenceDestination(roomId);
        SimpSubscription first = mock(SimpSubscription.class);
        SimpSubscription second = mock(SimpSubscription.class);
        when(first.getDestination()).thenReturn(destination);
        when(second.getDestination()).thenReturn(destination);
        when(users.findSubscriptions(any())).thenReturn(Set.of(first, second));
        when(sessions.findActive(roomId)).thenReturn(List.of());

        publisher.publishSnapshots();

        verify(sessions).findActive(roomId);
        var event = ArgumentCaptor.forClass(StompRoomEventPublisher.RoomEvent.class);
        verify(messaging).convertAndSend(eq(destination), event.capture());
        assertThat(event.getValue().type()).isEqualTo("PRESENCE_SNAPSHOT");
        assertThat(event.getValue().payload()).isEqualTo(new RoomPresencePublisher.Presence(List.of()));
    }

    @Test
    void doesNotQueryTheDatabaseWhenNobodySubscribes() {
        when(users.findSubscriptions(any())).thenReturn(Set.of());

        publisher.publishSnapshots();

        verifyNoInteractions(sessions, messaging);
    }
}

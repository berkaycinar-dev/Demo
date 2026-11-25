package com.samedesk.backend.realtime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.SimpMessagingTemplate;

class StompUserEventPublisherTest {

    private static final Instant NOW = Instant.parse("2026-11-26T12:00:00Z");
    private final SimpMessagingTemplate messaging = mock(SimpMessagingTemplate.class);
    private final StompUserEventPublisher publisher =
            new StompUserEventPublisher(messaging, Clock.fixed(NOW, ZoneOffset.UTC));

    @Test
    void targetsTheUserAndIncludesAnEventIdentityWithoutARoom() {
        UUID userId = UUID.randomUUID();
        Object payload = new Object();

        publisher.publish(userId, "TIMER_STARTED", payload);

        var captured = ArgumentCaptor.forClass(StompUserEventPublisher.UserEvent.class);
        verify(messaging).convertAndSendToUser(eq(userId.toString()), eq("/queue/timers"), captured.capture());
        var event = captured.getValue();
        assertThat(event.schemaVersion()).isEqualTo(1);
        assertThat(event.eventId()).isNotNull();
        assertThat(event.type()).isEqualTo("TIMER_STARTED");
        assertThat(event.userId()).isEqualTo(userId);
        assertThat(event.occurredAt()).isEqualTo(NOW.toString());
        assertThat(event.payload()).isSameAs(payload);
    }

    @Test
    void deliveryFailureDoesNotFailAnAlreadyCommittedCommand() {
        doThrow(new MessagingException("broker unavailable")).when(messaging)
                .convertAndSendToUser(any(String.class), eq("/queue/timers"), any());

        assertThatCode(() -> publisher.publish(UUID.randomUUID(), "TIMER_PAUSED", new Object()))
                .doesNotThrowAnyException();
    }
}

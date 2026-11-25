package com.demo.backend.realtime;

import java.time.Clock;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Primary;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@Primary
class StompRoomEventPublisher implements RoomEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(StompRoomEventPublisher.class);

    private final ApplicationEventPublisher events;
    private final SimpMessagingTemplate messaging;
    private final Clock clock;

    StompRoomEventPublisher(ApplicationEventPublisher events, SimpMessagingTemplate messaging, Clock clock) {
        this.events = events;
        this.messaging = messaging;
        this.clock = clock;
    }

    @Override
    public void publish(String roomId, String eventType, Object payload) {
        events.publishEvent(new RoomEvent(1, UUID.randomUUID(), eventType, UUID.fromString(roomId),
                clock.instant().toString(), payload));
    }

    @TransactionalEventListener(fallbackExecution = true)
    void broadcast(RoomEvent event) {
        try {
            messaging.convertAndSend(StompRoomAccess.eventDestination(event.roomId()), event);
        } catch (MessagingException ex) {
            // The room transaction has committed. A delivery failure must not change its REST result.
            log.warn("Room event could not be broadcast: id={}, room={}, type={}",
                    event.eventId(), event.roomId(), event.type());
        }
    }

    record RoomEvent(int schemaVersion, UUID eventId, String type, UUID roomId, String occurredAt, Object payload) { }
}

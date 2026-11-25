package com.samedesk.backend.realtime;

import java.time.Clock;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
class StompUserEventPublisher implements UserEventPublisher {

    static final String TIMER_QUEUE = "/queue/timers";
    static final String TIMER_SUBSCRIPTION = "/user" + TIMER_QUEUE;
    private static final Logger log = LoggerFactory.getLogger(StompUserEventPublisher.class);

    private final SimpMessagingTemplate messaging;
    private final Clock clock;

    StompUserEventPublisher(SimpMessagingTemplate messaging, Clock clock) {
        this.messaging = messaging;
        this.clock = clock;
    }

    @Override
    public void publish(UUID userId, String eventType, Object payload) {
        var event = new UserEvent(1, UUID.randomUUID(), eventType, userId, clock.instant().toString(), payload);
        try {
            messaging.convertAndSendToUser(userId.toString(), TIMER_QUEUE, event);
        } catch (MessagingException ex) {
            log.warn("Personal event could not be broadcast: id={}, user={}, type={}",
                    event.eventId(), userId, eventType);
        }
    }

    record UserEvent(int schemaVersion, UUID eventId, String type, UUID userId, String occurredAt, Object payload) { }
}

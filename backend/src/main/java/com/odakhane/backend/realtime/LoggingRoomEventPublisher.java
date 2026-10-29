package com.odakhane.backend.realtime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Placeholder implementation: only writes events to the log.
 *
 * Lets C develop and run every service before D's STOMP implementation exists.
 * When D adds the STOMP publisher, D marks it @Primary (or deletes this class),
 * and no service code changes.
 */
@Component
public class LoggingRoomEventPublisher implements RoomEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(LoggingRoomEventPublisher.class);

    @Override
    public void publish(String roomId, String eventType, Object payload) {
        log.info("[room-event] room={} type={} payload={}", roomId, eventType, payload);
    }
}

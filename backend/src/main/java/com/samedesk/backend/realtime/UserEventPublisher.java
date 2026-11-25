package com.samedesk.backend.realtime;

import java.util.UUID;

/** Publishes personal timer events to the user's connected sessions. Call after the database commit. */
public interface UserEventPublisher {

    void publish(UUID userId, String eventType, Object payload);
}

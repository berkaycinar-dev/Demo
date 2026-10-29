package com.odakhane.backend.realtime;

/**
 * The only door from business logic (C) to real-time broadcasting (D).
 *
 * Services call publish(...) when something room-wide happens
 * (someone joined, a timer started, points changed). They never touch
 * WebSocket/STOMP directly. D provides the STOMP implementation; until then
 * LoggingRoomEventPublisher is used, and unit tests use a mock.
 */
public interface RoomEventPublisher {

    /**
     * @param roomId    room the event belongs to
     * @param eventType stable event name, e.g. "MEMBER_JOINED", "TIMER_STARTED"
     * @param payload   event body (a DTO / record), serialized to JSON by the implementation
     */
    void publish(String roomId, String eventType, Object payload);
}

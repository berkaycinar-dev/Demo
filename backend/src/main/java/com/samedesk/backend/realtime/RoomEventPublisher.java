package com.samedesk.backend.realtime;

/**
 * The door from business logic (C) to room-wide broadcasting (D).
 *
 * Services call publish(...) when something room-wide happens
 * (someone joined, points changed). Personal timers use {@link UserEventPublisher}. Services never touch
 * WebSocket/STOMP directly. D provides the STOMP implementation; until then
 * LoggingRoomEventPublisher is used, and unit tests use a mock.
 */
public interface RoomEventPublisher {

    /**
     * @param roomId    room the event belongs to
     * @param eventType stable room event name, e.g. "MEMBER_JOINED"
     * @param payload   event body (a DTO / record), serialized to JSON by the implementation
     */
    void publish(String roomId, String eventType, Object payload);
}

package com.samedesk.backend.room;

/** What a person inside a room is doing. Matches PresenceStatus in openapi.yaml. */
public enum PresenceStatus {
    /** At the desk, timer not running. */
    IDLE,
    FOCUS,
    /** On a break, usually at a break spot (RoomSession.breakSpot). */
    BREAK,
    AWAY
}

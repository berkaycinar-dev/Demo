package com.demo.backend.room;

/** What GET /api/v1/rooms returns: every public room, or the rooms the caller belongs to. */
public enum RoomScope {
    PUBLIC,
    MINE
}

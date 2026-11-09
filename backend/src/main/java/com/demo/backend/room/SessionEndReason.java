package com.demo.backend.room;

/** Why a room session ended. */
public enum SessionEndReason {
    /** The user left the room view on purpose. */
    EXIT,
    /** No heartbeat for longer than the timeout (connection lost). */
    TIMEOUT,
    /** The user gave up membership, so the open session was closed with it. */
    LEFT_ROOM
}

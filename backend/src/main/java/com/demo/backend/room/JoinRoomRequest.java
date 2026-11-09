package com.demo.backend.room;

/** The body is optional. inviteCode is needed only for private rooms. */
public record JoinRoomRequest(String inviteCode) {
}

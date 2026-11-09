package com.demo.backend.room;

/** Role of a user inside one room. Exactly one OWNER per room (the creator). */
public enum RoomRole {
    OWNER,
    MEMBER
}

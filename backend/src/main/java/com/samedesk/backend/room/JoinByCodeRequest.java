package com.samedesk.backend.room;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Body of POST /api/v1/rooms/join-by-code: the invite code of a private room, typed by hand. */
public record JoinByCodeRequest(@NotBlank @Size(max = 32) String inviteCode) {
}

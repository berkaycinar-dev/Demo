package com.samedesk.backend.room;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/**
 * Body of PUT /api/v1/rooms/{roomId}/sessions/current/status.
 *
 * @param status       the new status
 * @param spot         break spot id (room furniture), only used with BREAK; null = no particular spot
 * @param spotCapacity how many people fit at that spot (the frontend knows the room layout); default 2
 * @param slot         which place of the spot the client would like (0-based); the server may give another
 */
public record ChangeStatusRequest(
        @NotNull PresenceStatus status,
        @Pattern(regexp = "[A-Za-z0-9_-]{1,40}") String spot,
        @Min(1) @Max(8) Integer spotCapacity,
        @Min(0) @Max(7) Integer slot) {

    /** Without a preferred place (older clients, tests). */
    public ChangeStatusRequest(PresenceStatus status, String spot, Integer spotCapacity) {
        this(status, spot, spotCapacity, null);
    }
}

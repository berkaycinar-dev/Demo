package com.demo.backend.room;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** visibility and maxMembers are optional: the service uses PUBLIC and 8 when they are missing. */
public record CreateRoomRequest(
        @NotBlank @Size(max = 60) String name,
        @Size(max = 200) String description,
        RoomVisibility visibility,
        @Min(2) @Max(10) Integer maxMembers) {
}

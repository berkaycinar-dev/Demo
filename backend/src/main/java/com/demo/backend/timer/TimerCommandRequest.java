package com.demo.backend.timer;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.util.UUID;

/** Matches TimerCommandRequest in openapi.yaml. preset is needed only for SET_PRESET. */
public record TimerCommandRequest(
        @NotNull UUID commandId,
        @NotNull @PositiveOrZero Long expectedVersion,
        @NotNull TimerCommandType type,
        String preset) {
}

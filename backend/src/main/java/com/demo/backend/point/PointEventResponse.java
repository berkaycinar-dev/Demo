package com.demo.backend.point;

import java.time.Instant;
import java.util.UUID;

/** One entry of the points history. */
public record PointEventResponse(
        UUID id,
        PointKind kind,
        int points,
        int basePoints,
        int bonusPoints,
        int focusSeconds,
        String preset,
        Instant earnedAt) {

    static PointEventResponse of(PointEvent e) {
        return new PointEventResponse(e.getId(), e.getKind(), e.getPoints(), e.getBasePoints(),
                e.getBonusPoints(), e.getFocusSeconds(), e.getPreset(), e.getEarnedAt());
    }
}

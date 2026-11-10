package com.demo.backend.point;

import java.util.Map;
import org.springframework.stereotype.Component;

/** How many points a finished focus block is worth. Pure arithmetic: no database, no clock. */
@Component
public class PointRules {

    /** The points of one award, split so history can show where they came from. */
    public record Award(int basePoints, int bonusPoints) {
        public int total() {
            return basePoints + bonusPoints;
        }
    }

    private final int perFocusMinute;
    private final Map<String, Integer> blockBonus;

    public PointRules(PointProperties properties) {
        this.perFocusMinute = Math.max(0, properties.perFocusMinute());
        this.blockBonus = properties.blockBonus() == null ? Map.of() : Map.copyOf(properties.blockBonus());
    }

    /** Base = whole focus minutes x the per-minute value. Bonus = the preset's bonus (0 if none is set). */
    public Award forFocusBlock(String preset, int focusSeconds) {
        int base = (focusSeconds / 60) * perFocusMinute;
        int bonus = Math.max(0, blockBonus.getOrDefault(preset, 0));
        return new Award(base, bonus);
    }
}

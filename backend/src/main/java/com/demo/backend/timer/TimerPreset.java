package com.demo.backend.timer;

import java.util.List;
import java.util.Optional;

/** A fixed Pomodoro preset: focus minutes and break minutes. Ids match the frontend ("25-5"). */
public final class TimerPreset {

    public static final TimerPreset P25_5 = new TimerPreset("25-5", 25, 5);
    public static final TimerPreset P50_10 = new TimerPreset("50-10", 50, 10);
    public static final TimerPreset P90_15 = new TimerPreset("90-15", 90, 15);

    public static final TimerPreset DEFAULT = P25_5;

    private static final List<TimerPreset> ALL = List.of(P25_5, P50_10, P90_15);

    private final String id;
    private final int focusMinutes;
    private final int breakMinutes;

    private TimerPreset(String id, int focusMinutes, int breakMinutes) {
        this.id = id;
        this.focusMinutes = focusMinutes;
        this.breakMinutes = breakMinutes;
    }

    public static Optional<TimerPreset> find(String id) {
        return ALL.stream().filter(p -> p.id.equals(id)).findFirst();
    }

    /** For stored values, which the database already restricts to the known ids. */
    public static TimerPreset of(String id) {
        return find(id).orElseThrow(() -> new IllegalStateException("Unknown timer preset: " + id));
    }

    public String id() {
        return id;
    }

    public int focusSeconds() {
        return focusMinutes * 60;
    }

    public int breakSeconds() {
        return breakMinutes * 60;
    }

    public int seconds(TimerPhase phase) {
        return phase == TimerPhase.FOCUS ? focusSeconds() : breakSeconds();
    }
}

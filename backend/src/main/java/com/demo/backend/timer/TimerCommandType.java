package com.demo.backend.timer;

/** What the user asks the timer to do (see the "timer" tag in openapi.yaml). */
public enum TimerCommandType {
    START,
    PAUSE,
    RESUME,
    SKIP,
    RESET,
    SET_PRESET
}

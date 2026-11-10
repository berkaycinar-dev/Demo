package com.demo.backend.timer;

/** Which part of a Pomodoro cycle the timer is in. IDLE always means a fresh FOCUS block is ready. */
public enum TimerPhase {
    FOCUS,
    BREAK
}

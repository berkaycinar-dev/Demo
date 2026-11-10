package com.demo.backend.timer;

/** Whether the timer is counting down. ends_at is set only while RUNNING. */
public enum TimerStatus {
    IDLE,
    RUNNING,
    PAUSED
}

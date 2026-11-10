package com.demo.backend.timer;

import com.demo.backend.common.error.BusinessRuleException;
import com.demo.backend.point.PointService;
import com.demo.backend.realtime.AfterCommit;
import com.demo.backend.realtime.RoomEventPublisher;
import com.demo.backend.room.RoomSessionRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The caller's personal Pomodoro timer: read it, and change it with commands.
 * The rules live in {@link TimerState}; this class adds the database, the command-id memory and the events.
 *
 * Every call locks the user's timer row first, so requests of one user run one after the other.
 */
@Service
public class TimerService {

    static final String STALE_VERSION = "STALE_VERSION";

    private final TimerStateRepository states;
    private final TimerCommandRepository commands;
    private final RoomSessionRepository sessions;
    private final RoomEventPublisher events;
    private final PointService points;
    private final Clock clock;

    public TimerService(TimerStateRepository states, TimerCommandRepository commands,
                        RoomSessionRepository sessions, RoomEventPublisher events, PointService points,
                        Clock clock) {
        this.states = states;
        this.commands = commands;
        this.sessions = sessions;
        this.events = events;
        this.points = points;
        this.clock = clock;
    }

    /** Reads the timer (creating an idle one the first time). A phase that ran out meanwhile is settled first. */
    @Transactional
    public TimerStateResponse get(UUID userId) {
        Instant now = clock.instant();
        TimerState state = lockOrCreate(userId);
        List<TimerState.Finished> finished = state.settle(now);
        awardPoints(state, finished);
        publishFinished(state, state.getPreset(), finished, now);
        return TimerStateResponse.of(state, now);
    }

    /**
     * Applies one command. A command id seen before returns its first result and changes nothing.
     * A wrong expectedVersion is 409 STALE_VERSION (and nothing is saved).
     */
    @Transactional
    public TimerStateResponse execute(UUID userId, TimerCommandRequest request) {
        Instant now = clock.instant();
        TimerState state = lockOrCreate(userId);

        TimerCommand done = commands.findByUserIdAndCommandId(userId, request.commandId()).orElse(null);
        if (done != null) {
            return TimerStateResponse.of(done, now);
        }

        List<TimerState.Finished> finished = state.settle(now);
        if (state.getVersion() != request.expectedVersion()) {
            throw new BusinessRuleException(STALE_VERSION, "The timer changed. Read it again.");
        }
        // The blocks that just ran out belong to the preset they ran under, so they are credited and
        // announced before the command (which may be SET_PRESET) is applied.
        String settledPreset = state.getPreset();
        awardPoints(state, finished);
        TimerState.Change change = state.apply(request.type(), request.preset(), now);
        commands.save(new TimerCommand(request.commandId(), request.type(), state, now));

        publishFinished(state, settledPreset, finished, now);
        publish(userId, eventTypeOf(change), new TimerEvent(userId, state.getPreset(), state.getPhase(),
                state.getEndsAt(), state.remainingAt(now), state.getVersion(), now));
        return TimerStateResponse.of(state, now);
    }

    /** Forgets command ids older than the cutoff. Called by TimerCommandCleanup. */
    @Transactional
    public int forgetCommandsOlderThan(Instant cutoff) {
        return commands.deleteOlderThan(cutoff);
    }

    private TimerState lockOrCreate(UUID userId) {
        states.insertIfAbsent(userId, TimerPreset.DEFAULT.id(), TimerPreset.DEFAULT.focusSeconds());
        return states.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new IllegalStateException("Timer row missing after insert"));
    }

    /** Every focus block that ran out by itself earns points (if the user was inside a room, see PointService). */
    private void awardPoints(TimerState state, List<TimerState.Finished> finished) {
        int focusSeconds = TimerPreset.of(state.getPreset()).focusSeconds();
        for (TimerState.Finished f : finished) {
            if (f.phase() == TimerPhase.FOCUS) {
                points.awardFocusBlock(state.getUserId(), state.getPreset(), focusSeconds, f.endedAt());
            }
        }
    }

    private void publishFinished(TimerState state, String preset, List<TimerState.Finished> finished, Instant now) {
        for (TimerState.Finished f : finished) {
            publish(state.getUserId(), TimerEvent.FINISHED, new TimerEvent(state.getUserId(), preset,
                    f.phase(), f.endedAt(), 0, state.getVersion(), now));
        }
    }

    /** After the commit, to every room where the user has an open session (none: nothing is published). */
    private void publish(UUID userId, String type, TimerEvent payload) {
        List<UUID> rooms = sessions.findOpenRoomIds(userId);
        if (rooms.isEmpty()) {
            return;
        }
        AfterCommit.run(() -> rooms.forEach(room -> events.publish(room.toString(), type, payload)));
    }

    private static String eventTypeOf(TimerState.Change change) {
        return switch (change) {
            case STARTED -> TimerEvent.STARTED;
            case PAUSED -> TimerEvent.PAUSED;
            case RESET -> TimerEvent.RESET;
        };
    }
}

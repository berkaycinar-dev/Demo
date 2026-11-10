package com.demo.backend.timer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.demo.backend.common.error.BusinessRuleException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/** Pure rules of the timer: no Spring, no database, no mocks. */
class TimerStateTest {

    private static final Instant T0 = Instant.parse("2026-11-10T10:00:00Z");

    private final TimerState timer = TimerState.idle(UUID.randomUUID());

    private static void assertCode(Runnable action, String code) {
        assertThatThrownBy(action::run).isInstanceOfSatisfying(BusinessRuleException.class,
                e -> assertThat(e.getCode()).isEqualTo(code));
    }

    // ---------- start, pause, resume ----------

    @Test
    void newTimerIsIdleFocusWithDefaultPreset() {
        assertThat(timer.getPreset()).isEqualTo("25-5");
        assertThat(timer.getPhase()).isEqualTo(TimerPhase.FOCUS);
        assertThat(timer.getStatus()).isEqualTo(TimerStatus.IDLE);
        assertThat(timer.getRemainingSeconds()).isEqualTo(1500);
        assertThat(timer.getEndsAt()).isNull();
        assertThat(timer.getVersion()).isZero();
    }

    @Test
    void startRunsUntilFocusLengthFromNow() {
        TimerState.Change change = timer.apply(TimerCommandType.START, null, T0);

        assertThat(change).isEqualTo(TimerState.Change.STARTED);
        assertThat(timer.getStatus()).isEqualTo(TimerStatus.RUNNING);
        assertThat(timer.getEndsAt()).isEqualTo(T0.plusSeconds(1500));
        assertThat(timer.getVersion()).isEqualTo(1);
    }

    @Test
    void startWhileRunningIsAnInvalidTransition() {
        timer.apply(TimerCommandType.START, null, T0);

        assertCode(() -> timer.apply(TimerCommandType.START, null, T0), "INVALID_TIMER_TRANSITION");
        assertThat(timer.getVersion()).isEqualTo(1);
    }

    @Test
    void remainingIsRoundedUp() {
        timer.apply(TimerCommandType.START, null, T0);

        assertThat(timer.remainingAt(T0.plusSeconds(100))).isEqualTo(1400);
        assertThat(timer.remainingAt(T0.plusMillis(100_200))).isEqualTo(1400);
    }

    @Test
    void pauseKeepsTheTimeLeftAndResumeContinuesFromIt() {
        timer.apply(TimerCommandType.START, null, T0);

        TimerState.Change paused = timer.apply(TimerCommandType.PAUSE, null, T0.plusSeconds(600));
        assertThat(paused).isEqualTo(TimerState.Change.PAUSED);
        assertThat(timer.getStatus()).isEqualTo(TimerStatus.PAUSED);
        assertThat(timer.getRemainingSeconds()).isEqualTo(900);
        assertThat(timer.getEndsAt()).isNull();

        timer.apply(TimerCommandType.RESUME, null, T0.plusSeconds(1000));
        assertThat(timer.getStatus()).isEqualTo(TimerStatus.RUNNING);
        assertThat(timer.getEndsAt()).isEqualTo(T0.plusSeconds(1900));
    }

    @Test
    void pauseAndResumeNeedTheRightStatus() {
        assertCode(() -> timer.apply(TimerCommandType.PAUSE, null, T0), "INVALID_TIMER_TRANSITION");
        assertCode(() -> timer.apply(TimerCommandType.RESUME, null, T0), "INVALID_TIMER_TRANSITION");
    }

    @Test
    void pauseNeverLeavesZeroSeconds() {
        timer.apply(TimerCommandType.START, null, T0);

        timer.apply(TimerCommandType.PAUSE, null, T0.plusMillis(1_499_900));

        assertThat(timer.getRemainingSeconds()).isEqualTo(1);
    }

    // ---------- settle ----------

    @Test
    void settleBeforeTheEndChangesNothing() {
        timer.apply(TimerCommandType.START, null, T0);

        assertThat(timer.settle(T0.plusSeconds(1499))).isEmpty();
        assertThat(timer.getVersion()).isEqualTo(1);
    }

    @Test
    void finishedFocusStartsTheBreakFromTheExactEndTime() {
        timer.apply(TimerCommandType.START, null, T0);

        List<TimerState.Finished> finished = timer.settle(T0.plusSeconds(1505));

        assertThat(finished).containsExactly(new TimerState.Finished(TimerPhase.FOCUS, T0.plusSeconds(1500)));
        assertThat(timer.getPhase()).isEqualTo(TimerPhase.BREAK);
        assertThat(timer.getStatus()).isEqualTo(TimerStatus.RUNNING);
        assertThat(timer.getEndsAt()).isEqualTo(T0.plusSeconds(1800)); // no drift from the 5 late seconds
        assertThat(timer.getCompletedFocusBlocks()).isEqualTo(1);
    }

    @Test
    void finishedBreakStartsTheNextFocusButCountsNoBlock() {
        timer.apply(TimerCommandType.START, null, T0);
        timer.settle(T0.plusSeconds(1505));

        List<TimerState.Finished> finished = timer.settle(T0.plusSeconds(1810));

        assertThat(finished).containsExactly(new TimerState.Finished(TimerPhase.BREAK, T0.plusSeconds(1800)));
        assertThat(timer.getPhase()).isEqualTo(TimerPhase.FOCUS);
        assertThat(timer.getStatus()).isEqualTo(TimerStatus.RUNNING);
        assertThat(timer.getEndsAt()).isEqualTo(T0.plusSeconds(3300));
        assertThat(timer.getCompletedFocusBlocks()).isEqualTo(1);
    }

    @Test
    void whenNobodyWasAroundTheTimerStopsAtIdle() {
        timer.apply(TimerCommandType.START, null, T0);

        List<TimerState.Finished> finished = timer.settle(T0.plusSeconds(1500 + 300 + 50));

        assertThat(finished).containsExactly(
                new TimerState.Finished(TimerPhase.FOCUS, T0.plusSeconds(1500)),
                new TimerState.Finished(TimerPhase.BREAK, T0.plusSeconds(1800)));
        assertThat(timer.getStatus()).isEqualTo(TimerStatus.IDLE);
        assertThat(timer.getPhase()).isEqualTo(TimerPhase.FOCUS);
        assertThat(timer.getEndsAt()).isNull();
        assertThat(timer.getRemainingSeconds()).isEqualTo(1500);
        assertThat(timer.getCompletedFocusBlocks()).isEqualTo(1);
    }

    @Test
    void whenTheBreakAndTheNextFocusBothEndedOnlyTheBreakIsReportedAndTheTimerStops() {
        timer.apply(TimerCommandType.START, null, T0);
        timer.settle(T0.plusSeconds(1505)); // break running, ends at +1800

        List<TimerState.Finished> finished = timer.settle(T0.plusSeconds(1800 + 1500 + 10));

        assertThat(finished).containsExactly(new TimerState.Finished(TimerPhase.BREAK, T0.plusSeconds(1800)));
        assertThat(timer.getStatus()).isEqualTo(TimerStatus.IDLE);
        assertThat(timer.getCompletedFocusBlocks()).isEqualTo(1);
    }

    @Test
    void settleDoesNothingWhilePausedOrIdle() {
        assertThat(timer.settle(T0.plusSeconds(99_999))).isEmpty();
        timer.apply(TimerCommandType.START, null, T0);
        timer.apply(TimerCommandType.PAUSE, null, T0.plusSeconds(10));

        assertThat(timer.settle(T0.plusSeconds(99_999))).isEmpty();
    }

    // ---------- skip, reset, preset ----------

    @Test
    void skipNeedsARunningOrPausedTimer() {
        assertCode(() -> timer.apply(TimerCommandType.SKIP, null, T0), "INVALID_TIMER_TRANSITION");
    }

    @Test
    void skippingFocusStartsTheBreakAndCountsNothing() {
        timer.apply(TimerCommandType.START, null, T0);

        TimerState.Change change = timer.apply(TimerCommandType.SKIP, null, T0.plusSeconds(60));

        assertThat(change).isEqualTo(TimerState.Change.STARTED);
        assertThat(timer.getPhase()).isEqualTo(TimerPhase.BREAK);
        assertThat(timer.getStatus()).isEqualTo(TimerStatus.RUNNING);
        assertThat(timer.getEndsAt()).isEqualTo(T0.plusSeconds(360));
        assertThat(timer.getCompletedFocusBlocks()).isZero();
    }

    @Test
    void skippingWhilePausedStartsTheNextPhaseRunning() {
        timer.apply(TimerCommandType.START, null, T0);
        timer.apply(TimerCommandType.SKIP, null, T0.plusSeconds(60)); // break
        timer.apply(TimerCommandType.PAUSE, null, T0.plusSeconds(100));

        timer.apply(TimerCommandType.SKIP, null, T0.plusSeconds(200));

        assertThat(timer.getPhase()).isEqualTo(TimerPhase.FOCUS);
        assertThat(timer.getStatus()).isEqualTo(TimerStatus.RUNNING);
        assertThat(timer.getEndsAt()).isEqualTo(T0.plusSeconds(1700));
    }

    @Test
    void resetGoesBackToIdleFocus() {
        timer.apply(TimerCommandType.START, null, T0);

        TimerState.Change change = timer.apply(TimerCommandType.RESET, null, T0.plusSeconds(5));

        assertThat(change).isEqualTo(TimerState.Change.RESET);
        assertThat(timer.getStatus()).isEqualTo(TimerStatus.IDLE);
        assertThat(timer.getRemainingSeconds()).isEqualTo(1500);
        assertThat(timer.getEndsAt()).isNull();
    }

    @Test
    void setPresetChangesLengthsAndResets() {
        timer.apply(TimerCommandType.START, null, T0);

        timer.apply(TimerCommandType.SET_PRESET, "50-10", T0.plusSeconds(5));

        assertThat(timer.getPreset()).isEqualTo("50-10");
        assertThat(timer.getStatus()).isEqualTo(TimerStatus.IDLE);
        assertThat(timer.getRemainingSeconds()).isEqualTo(3000);

        timer.apply(TimerCommandType.SET_PRESET, "90-15", T0);
        timer.apply(TimerCommandType.START, null, T0);
        assertThat(timer.getEndsAt()).isEqualTo(T0.plusSeconds(5400));
        assertThat(timer.totalSeconds()).isEqualTo(5400);
    }

    @Test
    void unknownOrMissingPresetIsRejectedAndChangesNothing() {
        assertCode(() -> timer.apply(TimerCommandType.SET_PRESET, "7-7", T0), "INVALID_PRESET");
        assertCode(() -> timer.apply(TimerCommandType.SET_PRESET, null, T0), "INVALID_PRESET");
        assertThat(timer.getPreset()).isEqualTo("25-5");
        assertThat(timer.getVersion()).isZero();
    }
}

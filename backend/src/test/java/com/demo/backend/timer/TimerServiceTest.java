package com.demo.backend.timer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.demo.backend.common.error.BusinessRuleException;
import com.demo.backend.point.PointService;
import com.demo.backend.realtime.RoomEventPublisher;
import com.demo.backend.room.RoomSessionRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/** Unit test: repositories and the event publisher are mocks. No Spring, no database. */
class TimerServiceTest {

    private static final Instant NOW = Instant.parse("2026-11-10T10:00:00Z");
    private static final UUID ME = UUID.randomUUID();
    private static final UUID ROOM_A = UUID.randomUUID();
    private static final UUID ROOM_B = UUID.randomUUID();

    private final TimerStateRepository states = mock(TimerStateRepository.class);
    private final TimerCommandRepository commands = mock(TimerCommandRepository.class);
    private final RoomSessionRepository sessions = mock(RoomSessionRepository.class);
    private final RoomEventPublisher events = mock(RoomEventPublisher.class);
    private final PointService points = mock(PointService.class);
    private final TimerService service =
            new TimerService(states, commands, sessions, events, points, Clock.fixed(NOW, ZoneOffset.UTC));

    private TimerState stubState(TimerState state) {
        when(states.findByUserIdForUpdate(ME)).thenReturn(Optional.of(state));
        return state;
    }

    private static TimerCommandRequest request(TimerCommandType type, long version) {
        return new TimerCommandRequest(UUID.randomUUID(), version, type, null);
    }

    // ---------- get ----------

    @Test
    void getCreatesAnIdleTimerOnFirstUse() {
        stubState(TimerState.idle(ME));

        TimerStateResponse res = service.get(ME);

        verify(states).insertIfAbsent(ME, "25-5", 1500);
        assertThat(res.status()).isEqualTo(TimerStatus.IDLE);
        assertThat(res.remainingSeconds()).isEqualTo(1500);
        assertThat(res.totalSeconds()).isEqualTo(1500);
        assertThat(res.version()).isZero();
        assertThat(res.serverTime()).isEqualTo(NOW);
    }

    @Test
    void getSettlesAPhaseThatRanOutAndPublishesFinished() {
        TimerState state = TimerState.idle(ME);
        state.apply(TimerCommandType.START, null, NOW.minusSeconds(1600)); // focus ended 100 s ago
        stubState(state);
        when(sessions.findOpenRoomIds(ME)).thenReturn(List.of(ROOM_A));

        TimerStateResponse res = service.get(ME);

        assertThat(res.phase()).isEqualTo(TimerPhase.BREAK);
        assertThat(res.status()).isEqualTo(TimerStatus.RUNNING);
        assertThat(res.completedFocusBlocks()).isEqualTo(1);
        ArgumentCaptor<Object> payload = ArgumentCaptor.forClass(Object.class);
        verify(events).publish(eq(ROOM_A.toString()), eq("TIMER_FINISHED"), payload.capture());
        TimerEvent event = (TimerEvent) payload.getValue();
        assertThat(event.phase()).isEqualTo(TimerPhase.FOCUS);
        assertThat(event.endsAt()).isEqualTo(NOW.minusSeconds(100));
        assertThat(event.remainingSeconds()).isZero();
    }

    // ---------- execute ----------

    @Test
    void startRunsTheTimerSavesTheCommandAndPublishesToEveryRoomTheUserIsIn() {
        stubState(TimerState.idle(ME));
        when(sessions.findOpenRoomIds(ME)).thenReturn(List.of(ROOM_A, ROOM_B));
        TimerCommandRequest req = request(TimerCommandType.START, 0);

        TimerStateResponse res = service.execute(ME, req);

        assertThat(res.status()).isEqualTo(TimerStatus.RUNNING);
        assertThat(res.endsAt()).isEqualTo(NOW.plusSeconds(1500));
        assertThat(res.version()).isEqualTo(1);

        ArgumentCaptor<TimerCommand> saved = ArgumentCaptor.forClass(TimerCommand.class);
        verify(commands).save(saved.capture());
        assertThat(saved.getValue().getCommandId()).isEqualTo(req.commandId());
        assertThat(saved.getValue().getResultingVersion()).isEqualTo(1);

        ArgumentCaptor<Object> payload = ArgumentCaptor.forClass(Object.class);
        verify(events).publish(eq(ROOM_A.toString()), eq("TIMER_STARTED"), payload.capture());
        verify(events).publish(eq(ROOM_B.toString()), eq("TIMER_STARTED"), any());
        TimerEvent event = (TimerEvent) payload.getValue();
        assertThat(event.userId()).isEqualTo(ME);
        assertThat(event.phase()).isEqualTo(TimerPhase.FOCUS);
        assertThat(event.endsAt()).isEqualTo(NOW.plusSeconds(1500));
        assertThat(event.version()).isEqualTo(1);
    }

    @Test
    void userInNoRoomPublishesNothingButTheTimerStillWorks() {
        stubState(TimerState.idle(ME));
        when(sessions.findOpenRoomIds(ME)).thenReturn(List.of());

        TimerStateResponse res = service.execute(ME, request(TimerCommandType.START, 0));

        assertThat(res.status()).isEqualTo(TimerStatus.RUNNING);
        verify(events, never()).publish(any(), any(), any());
    }

    @Test
    void pauseAndResetPublishTheirOwnEventTypes() {
        TimerState state = TimerState.idle(ME);
        state.apply(TimerCommandType.START, null, NOW.minusSeconds(10));
        stubState(state);
        when(sessions.findOpenRoomIds(ME)).thenReturn(List.of(ROOM_A));

        service.execute(ME, request(TimerCommandType.PAUSE, 1));
        verify(events).publish(eq(ROOM_A.toString()), eq("TIMER_PAUSED"), any());

        service.execute(ME, request(TimerCommandType.RESET, 2));
        verify(events).publish(eq(ROOM_A.toString()), eq("TIMER_RESET"), any());
    }

    @Test
    void wrongExpectedVersionIsStaleAndNothingIsSavedOrPublished() {
        stubState(TimerState.idle(ME));
        when(sessions.findOpenRoomIds(ME)).thenReturn(List.of(ROOM_A));

        assertThatThrownBy(() -> service.execute(ME, request(TimerCommandType.START, 5)))
                .isInstanceOfSatisfying(BusinessRuleException.class,
                        e -> assertThat(e.getCode()).isEqualTo("STALE_VERSION"));

        verify(commands, never()).save(any());
        verify(events, never()).publish(any(), any(), any());
    }

    @Test
    void invalidTransitionIsRejectedAndNothingIsSaved() {
        stubState(TimerState.idle(ME));

        assertThatThrownBy(() -> service.execute(ME, request(TimerCommandType.PAUSE, 0)))
                .isInstanceOfSatisfying(BusinessRuleException.class,
                        e -> assertThat(e.getCode()).isEqualTo("INVALID_TIMER_TRANSITION"));

        verify(commands, never()).save(any());
    }

    @Test
    void repeatedCommandIdReturnsTheFirstResultAndAppliesNothing() {
        TimerState after = TimerState.idle(ME);
        after.apply(TimerCommandType.START, null, NOW.minusSeconds(2));
        UUID commandId = UUID.randomUUID();
        TimerCommand done = new TimerCommand(commandId, TimerCommandType.START, after, NOW.minusSeconds(2));

        TimerState current = stubState(TimerState.idle(ME));
        when(commands.findByUserIdAndCommandId(ME, commandId)).thenReturn(Optional.of(done));
        when(sessions.findOpenRoomIds(ME)).thenReturn(List.of(ROOM_A));

        TimerStateResponse res = service.execute(ME,
                new TimerCommandRequest(commandId, 0L, TimerCommandType.START, null));

        assertThat(res.version()).isEqualTo(1);
        assertThat(res.status()).isEqualTo(TimerStatus.RUNNING);
        assertThat(res.remainingSeconds()).isEqualTo(1498); // counted down from the first run's end time
        assertThat(current.getVersion()).isZero(); // the real timer was not touched
        verify(commands, never()).save(any());
        verify(events, never()).publish(any(), any(), any());
    }

    @Test
    void eventsWaitForTheCommit() {
        stubState(TimerState.idle(ME));
        when(sessions.findOpenRoomIds(ME)).thenReturn(List.of(ROOM_A));

        TransactionSynchronizationManager.initSynchronization();
        try {
            service.execute(ME, request(TimerCommandType.START, 0));
            verify(events, never()).publish(any(), any(), any());

            for (TransactionSynchronization sync : TransactionSynchronizationManager.getSynchronizations()) {
                sync.afterCommit();
            }
            verify(events, times(1)).publish(eq(ROOM_A.toString()), eq("TIMER_STARTED"), any());
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    // ---------- points ----------

    @Test
    void finishedFocusBlockIsCreditedWithItsEndTimeAndPresetLength() {
        TimerState state = TimerState.idle(ME);
        state.apply(TimerCommandType.START, null, NOW.minusSeconds(1600)); // focus ended 100 s ago
        stubState(state);

        service.get(ME);

        verify(points).awardFocusBlock(ME, "25-5", 1500, NOW.minusSeconds(100));
    }

    @Test
    void whenFocusAndBreakBothRanOutOnlyTheFocusBlockEarnsPoints() {
        TimerState state = TimerState.idle(ME);
        state.apply(TimerCommandType.START, null, NOW.minusSeconds(1500 + 300 + 50));
        stubState(state);

        service.get(ME);

        verify(points, times(1)).awardFocusBlock(any(), any(), anyInt(), any());
        verify(points).awardFocusBlock(ME, "25-5", 1500, NOW.minusSeconds(350));
    }

    @Test
    void runningBlockEarnsNothingYet() {
        TimerState state = TimerState.idle(ME);
        state.apply(TimerCommandType.START, null, NOW.minusSeconds(10));
        stubState(state);

        service.get(ME);

        verify(points, never()).awardFocusBlock(any(), any(), anyInt(), any());
    }

    @Test
    void commandCreditsTheBlockThatRanOutUnderTheOldPresetEvenWhenItChangesThePreset() {
        TimerState state = TimerState.idle(ME);
        state.apply(TimerCommandType.START, null, NOW.minusSeconds(1600)); // 25-5 focus ended 100 s ago
        stubState(state);
        when(sessions.findOpenRoomIds(ME)).thenReturn(List.of(ROOM_A));

        // START made it version 1; settling the finished block makes it version 2, which is what the client reads
        service.execute(ME, new TimerCommandRequest(UUID.randomUUID(), 2L, TimerCommandType.SET_PRESET, "90-15"));

        verify(points).awardFocusBlock(ME, "25-5", 1500, NOW.minusSeconds(100));
        ArgumentCaptor<Object> payload = ArgumentCaptor.forClass(Object.class);
        verify(events).publish(eq(ROOM_A.toString()), eq("TIMER_FINISHED"), payload.capture());
        assertThat(((TimerEvent) payload.getValue()).preset()).isEqualTo("25-5");
    }

    @Test
    void staleCommandCreditsNothing() {
        TimerState state = TimerState.idle(ME);
        state.apply(TimerCommandType.START, null, NOW.minusSeconds(1600));
        stubState(state);

        assertThatThrownBy(() -> service.execute(ME, request(TimerCommandType.PAUSE, 99)))
                .isInstanceOf(BusinessRuleException.class);

        verify(points, never()).awardFocusBlock(any(), any(), anyInt(), any());
    }

    @Test
    void repeatedCommandIdCreditsNothing() {
        TimerState after = TimerState.idle(ME);
        after.apply(TimerCommandType.START, null, NOW.minusSeconds(2));
        UUID commandId = UUID.randomUUID();
        stubState(TimerState.idle(ME));
        when(commands.findByUserIdAndCommandId(ME, commandId))
                .thenReturn(Optional.of(new TimerCommand(commandId, TimerCommandType.START, after, NOW)));

        service.execute(ME, new TimerCommandRequest(commandId, 0L, TimerCommandType.START, null));

        verify(points, never()).awardFocusBlock(any(), any(), anyInt(), any());
    }

    // ---------- clean-up ----------

    @Test
    void forgettingOldCommandsAsksTheRepository() {
        Instant cutoff = NOW.minusSeconds(86_400);
        when(commands.deleteOlderThan(cutoff)).thenReturn(3);

        assertThat(service.forgetCommandsOlderThan(cutoff)).isEqualTo(3);
    }
}

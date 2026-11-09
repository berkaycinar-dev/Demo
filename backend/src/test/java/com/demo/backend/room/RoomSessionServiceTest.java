package com.demo.backend.room;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.demo.backend.common.error.BusinessRuleException;
import com.demo.backend.common.error.NotFoundException;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/** Unit test: repositories are mocks. No Spring, no database. */
class RoomSessionServiceTest {

    private static final Instant NOW = Instant.parse("2026-11-09T10:00:00Z");
    private static final UUID ME = UUID.randomUUID();
    private static final UUID ROOM = UUID.randomUUID();

    private final RoomRepository rooms = mock(RoomRepository.class);
    private final RoomMemberRepository members = mock(RoomMemberRepository.class);
    private final RoomSessionRepository sessions = mock(RoomSessionRepository.class);
    private final RoomSessionService service =
            new RoomSessionService(rooms, members, sessions, Clock.fixed(NOW, ZoneOffset.UTC));

    // ---------- enter ----------

    @Test
    void enterOpensNewSessionForMember() {
        stubRoom(RoomVisibility.PUBLIC, true);
        when(sessions.findByRoomIdAndUserIdAndEndedAtIsNull(ROOM, ME)).thenReturn(Optional.empty());
        when(sessions.save(any(RoomSession.class))).thenAnswer(inv -> inv.getArgument(0));

        RoomSessionResponse res = service.enter(ME, ROOM);

        assertThat(res.roomId()).isEqualTo(ROOM);
        assertThat(res.startedAt()).isEqualTo(NOW);
        assertThat(res.lastSeenAt()).isEqualTo(NOW);
        verify(sessions).save(any(RoomSession.class));
    }

    @Test
    void enterAgainKeepsTheOpenSessionAndRefreshesIt() {
        stubRoom(RoomVisibility.PUBLIC, true);
        RoomSession open = new RoomSession(ROOM, ME, NOW.minusSeconds(120));
        when(sessions.findByRoomIdAndUserIdAndEndedAtIsNull(ROOM, ME)).thenReturn(Optional.of(open));

        RoomSessionResponse res = service.enter(ME, ROOM);

        assertThat(res.startedAt()).isEqualTo(NOW.minusSeconds(120));
        assertThat(res.lastSeenAt()).isEqualTo(NOW);
        verify(sessions, never()).save(any());
    }

    @Test
    void enterPublicRoomWithoutMembershipAsksToJoinFirst() {
        stubRoom(RoomVisibility.PUBLIC, false);

        assertThatThrownBy(() -> service.enter(ME, ROOM))
                .isInstanceOfSatisfying(BusinessRuleException.class,
                        e -> assertThat(e.getCode()).isEqualTo("NOT_A_MEMBER"));
        verify(sessions, never()).save(any());
    }

    @Test
    void enterPrivateRoomWithoutMembershipLooksLikeUnknownRoom() {
        stubRoom(RoomVisibility.PRIVATE, false);

        assertThatThrownBy(() -> service.enter(ME, ROOM))
                .isInstanceOfSatisfying(NotFoundException.class,
                        e -> assertThat(e.getCode()).isEqualTo("ROOM_NOT_FOUND"));
    }

    @Test
    void enterUnknownRoomIsNotFound() {
        when(rooms.findByIdForUpdate(ROOM)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.enter(ME, ROOM))
                .isInstanceOfSatisfying(NotFoundException.class,
                        e -> assertThat(e.getCode()).isEqualTo("ROOM_NOT_FOUND"));
    }

    // ---------- heartbeat ----------

    @Test
    void heartbeatRefreshesLastSeen() {
        RoomSession open = new RoomSession(ROOM, ME, NOW.minusSeconds(30));
        when(sessions.findByRoomIdAndUserIdAndEndedAtIsNull(ROOM, ME)).thenReturn(Optional.of(open));

        service.heartbeat(ME, ROOM);

        assertThat(open.getLastSeenAt()).isEqualTo(NOW);
        assertThat(open.isOpen()).isTrue();
    }

    @Test
    void heartbeatWithoutOpenSessionIsSessionNotFound() {
        when(sessions.findByRoomIdAndUserIdAndEndedAtIsNull(ROOM, ME)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.heartbeat(ME, ROOM))
                .isInstanceOfSatisfying(NotFoundException.class,
                        e -> assertThat(e.getCode()).isEqualTo("SESSION_NOT_FOUND"));
    }

    // ---------- exit ----------

    @Test
    void exitClosesOpenSessionWithExitReason() {
        RoomSession open = new RoomSession(ROOM, ME, NOW.minusSeconds(300));
        when(sessions.findByRoomIdAndUserIdAndEndedAtIsNull(ROOM, ME)).thenReturn(Optional.of(open));

        service.exit(ME, ROOM);

        assertThat(open.isOpen()).isFalse();
        assertThat(open.getEndedAt()).isEqualTo(NOW);
        assertThat(open.getEndReason()).isEqualTo(SessionEndReason.EXIT);
    }

    @Test
    void exitWithoutOpenSessionDoesNothing() {
        when(sessions.findByRoomIdAndUserIdAndEndedAtIsNull(ROOM, ME)).thenReturn(Optional.empty());

        service.exit(ME, ROOM); // must not throw
    }

    // ---------- active ----------

    @Test
    void activeListsPeopleInsideForMembers() {
        stubRoomForRead(RoomVisibility.PUBLIC, true);
        RoomSessionRepository.ActiveSession row = new RoomSessionRepository.ActiveSession() {
            @Override
            public UUID getUserId() {
                return ME;
            }

            @Override
            public String getUsername() {
                return "ada_l";
            }

            @Override
            public RoomRole getRole() {
                return RoomRole.MEMBER;
            }

            @Override
            public Instant getStartedAt() {
                return NOW;
            }
        };
        when(sessions.findActive(ROOM)).thenReturn(List.of(row));

        List<ActiveMemberResponse> res = service.active(ME, ROOM);

        assertThat(res).hasSize(1);
        assertThat(res.get(0).username()).isEqualTo("ada_l");
        assertThat(res.get(0).role()).isEqualTo(RoomRole.MEMBER);
    }

    @Test
    void activeIsHiddenFromNonMembersOfPrivateRoom() {
        stubRoomForRead(RoomVisibility.PRIVATE, false);

        assertThatThrownBy(() -> service.active(ME, ROOM)).isInstanceOf(NotFoundException.class);
        verify(sessions, never()).findActive(any());
    }

    // ---------- closeStale ----------

    @Test
    void closeStaleClosesWithTimeoutReason() {
        Instant cutoff = NOW.minusSeconds(60);
        when(sessions.closeStale(cutoff, SessionEndReason.TIMEOUT)).thenReturn(2);

        assertThat(service.closeStale(cutoff)).isEqualTo(2);
    }

    // ---------- helpers ----------

    private void stubRoom(RoomVisibility visibility, boolean member) {
        Room room = room(visibility);
        when(rooms.findByIdForUpdate(ROOM)).thenReturn(Optional.of(room));
        when(members.existsByRoomIdAndUserId(ROOM, ME)).thenReturn(member);
    }

    private void stubRoomForRead(RoomVisibility visibility, boolean member) {
        Room room = room(visibility);
        when(rooms.findById(ROOM)).thenReturn(Optional.of(room));
        when(members.existsByRoomIdAndUserId(ROOM, ME)).thenReturn(member);
    }

    private static Room room(RoomVisibility visibility) {
        Room room = new Room("Algoritma", null, visibility,
                visibility == RoomVisibility.PRIVATE ? "CODE2345" : null, 4, UUID.randomUUID(), NOW);
        try {
            java.lang.reflect.Field id = Room.class.getDeclaredField("id");
            id.setAccessible(true);
            id.set(room, ROOM);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(e);
        }
        return room;
    }
}

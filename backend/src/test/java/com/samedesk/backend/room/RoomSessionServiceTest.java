package com.samedesk.backend.room;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.samedesk.backend.common.error.BusinessRuleException;
import com.samedesk.backend.common.error.NotFoundException;
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

            @Override
            public String getAvatar() {
                return "{\"body\":\"female\"}";
            }

            @Override
            public Integer getSeat() {
                return 2;
            }

            @Override
            public PresenceStatus getStatus() {
                return PresenceStatus.BREAK;
            }

            @Override
            public String getBreakSpot() {
                return "sofa";
            }

            @Override
            public Integer getBreakSlot() {
                return 1;
            }

            @Override
            public Instant getStatusSince() {
                return NOW;
            }
        };
        when(sessions.findActive(ROOM)).thenReturn(List.of(row));

        List<ActiveMemberResponse> res = service.active(ME, ROOM);

        assertThat(res).hasSize(1);
        assertThat(res.get(0).username()).isEqualTo("ada_l");
        assertThat(res.get(0).role()).isEqualTo(RoomRole.MEMBER);
        assertThat(res.get(0).avatar()).isEqualTo("{\"body\":\"female\"}");
        assertThat(res.get(0).seat()).isEqualTo(2);
        assertThat(res.get(0).slot()).isEqualTo(1);
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

    // ---------- status ----------

    @Test
    void breakAtAFreeSpotIsStored() {
        stubRoom(RoomVisibility.PUBLIC, true);
        RoomSession open = new RoomSession(ROOM, ME, NOW.minusSeconds(600));
        when(sessions.findByRoomIdAndUserIdAndEndedAtIsNull(ROOM, ME)).thenReturn(Optional.of(open));
        when(sessions.findSlotsTakenByOthers(ROOM, ME, "sofa")).thenReturn(List.of(0));

        SessionStatusResponse res = service.changeStatus(ME, ROOM, new ChangeStatusRequest(PresenceStatus.BREAK, "sofa", 2));

        assertThat(res.status()).isEqualTo(PresenceStatus.BREAK);
        assertThat(res.spot()).isEqualTo("sofa");
        assertThat(res.slot()).isEqualTo(1); // place 0 is someone else's
        assertThat(res.statusSince()).isEqualTo(NOW);
        assertThat(open.getLastSeenAt()).isEqualTo(NOW); // counts as a heartbeat
        // the room row is locked while counting: two requests at once are handled one after the other
        verify(rooms).findByIdForUpdate(ROOM);
    }

    @Test
    void theAskedPlaceIsGivenWhenFreeOtherwiseTheLowestFreeOne() {
        assertThat(RoomSessionService.freePlace(List.of(), 2, 1)).isEqualTo(1);
        assertThat(RoomSessionService.freePlace(List.of(1), 2, 1)).isEqualTo(0);
        assertThat(RoomSessionService.freePlace(List.of(0), 3, null)).isEqualTo(1);
        assertThat(RoomSessionService.freePlace(List.of(), 2, 5)).isEqualTo(0); // past the spot's places
        assertThatThrownBy(() -> RoomSessionService.freePlace(List.of(0, 1), 2, 0))
                .isInstanceOfSatisfying(BusinessRuleException.class,
                        e -> assertThat(e.getCode()).isEqualTo("SPOT_TAKEN"));
    }

    // ---------- seats ----------

    @Test
    void enterGivesTheLowestFreeSeat() {
        stubRoom(RoomVisibility.PUBLIC, true);
        when(sessions.findByRoomIdAndUserIdAndEndedAtIsNull(ROOM, ME)).thenReturn(Optional.empty());
        when(sessions.findSeatsTaken(ROOM)).thenReturn(List.of(0, 2));
        when(sessions.save(any(RoomSession.class))).thenAnswer(inv -> inv.getArgument(0));

        service.enter(ME, ROOM);

        org.mockito.ArgumentCaptor<RoomSession> saved = org.mockito.ArgumentCaptor.forClass(RoomSession.class);
        verify(sessions).save(saved.capture());
        assertThat(saved.getValue().getSeat()).isEqualTo(1);
    }

    @Test
    void comingBackGetsTheSeatOfTheLastVisitWhenItIsFree() {
        stubRoom(RoomVisibility.PUBLIC, true);
        RoomSession last = new RoomSession(ROOM, ME, NOW.minusSeconds(900));
        last.takeSeat(3);
        last.end(SessionEndReason.TIMEOUT, NOW.minusSeconds(300));
        when(sessions.findByRoomIdAndUserIdAndEndedAtIsNull(ROOM, ME)).thenReturn(Optional.empty());
        when(sessions.findFirstByRoomIdAndUserIdAndEndedAtIsNotNullOrderByStartedAtDesc(ROOM, ME)).thenReturn(Optional.of(last));
        when(sessions.findSeatsTaken(ROOM)).thenReturn(List.of(0));
        when(sessions.save(any(RoomSession.class))).thenAnswer(inv -> inv.getArgument(0));

        service.enter(ME, ROOM);

        org.mockito.ArgumentCaptor<RoomSession> saved = org.mockito.ArgumentCaptor.forClass(RoomSession.class);
        verify(sessions).save(saved.capture());
        assertThat(saved.getValue().getSeat()).isEqualTo(3); // not 1, the lowest free one
    }

    @Test
    void comingBackToATakenSeatGetsTheLowestFreeOne() {
        stubRoom(RoomVisibility.PUBLIC, true);
        RoomSession last = new RoomSession(ROOM, ME, NOW.minusSeconds(900));
        last.takeSeat(0);
        last.end(SessionEndReason.EXIT, NOW.minusSeconds(300));
        when(sessions.findByRoomIdAndUserIdAndEndedAtIsNull(ROOM, ME)).thenReturn(Optional.empty());
        when(sessions.findFirstByRoomIdAndUserIdAndEndedAtIsNotNullOrderByStartedAtDesc(ROOM, ME)).thenReturn(Optional.of(last));
        when(sessions.findSeatsTaken(ROOM)).thenReturn(List.of(0));
        when(sessions.save(any(RoomSession.class))).thenAnswer(inv -> inv.getArgument(0));

        service.enter(ME, ROOM);

        org.mockito.ArgumentCaptor<RoomSession> saved = org.mockito.ArgumentCaptor.forClass(RoomSession.class);
        verify(sessions).save(saved.capture());
        assertThat(saved.getValue().getSeat()).isEqualTo(1);
    }

    @Test
    void enterAgainKeepsTheSeat() {
        stubRoom(RoomVisibility.PUBLIC, true);
        RoomSession open = new RoomSession(ROOM, ME, NOW.minusSeconds(120));
        open.takeSeat(3);
        when(sessions.findByRoomIdAndUserIdAndEndedAtIsNull(ROOM, ME)).thenReturn(Optional.of(open));

        service.enter(ME, ROOM);

        assertThat(open.getSeat()).isEqualTo(3);
        verify(sessions, never()).findSeatsTaken(any());
    }

    @Test
    void fullSpotIsRefusedAndNothingChanges() {
        stubRoom(RoomVisibility.PUBLIC, true);
        RoomSession open = new RoomSession(ROOM, ME, NOW.minusSeconds(600));
        when(sessions.findByRoomIdAndUserIdAndEndedAtIsNull(ROOM, ME)).thenReturn(Optional.of(open));
        when(sessions.findSlotsTakenByOthers(ROOM, ME, "hammock")).thenReturn(List.of(0));

        assertThatThrownBy(() -> service.changeStatus(ME, ROOM, new ChangeStatusRequest(PresenceStatus.BREAK, "hammock", 1)))
                .isInstanceOfSatisfying(BusinessRuleException.class,
                        e -> assertThat(e.getCode()).isEqualTo("SPOT_TAKEN"));
        assertThat(open.getStatus()).isEqualTo(PresenceStatus.IDLE);
        assertThat(open.getBreakSpot()).isNull();
    }

    @Test
    void spotCapacityDefaultsToTwo() {
        stubRoom(RoomVisibility.PUBLIC, true);
        when(sessions.findByRoomIdAndUserIdAndEndedAtIsNull(ROOM, ME))
                .thenReturn(Optional.of(new RoomSession(ROOM, ME, NOW.minusSeconds(600))));
        when(sessions.findSlotsTakenByOthers(ROOM, ME, "sofa")).thenReturn(List.of(0, 1));

        assertThatThrownBy(() -> service.changeStatus(ME, ROOM, new ChangeStatusRequest(PresenceStatus.BREAK, "sofa", null)))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void leavingTheBreakClearsTheSpotWithoutCounting() {
        stubRoom(RoomVisibility.PUBLIC, true);
        RoomSession open = new RoomSession(ROOM, ME, NOW.minusSeconds(600));
        open.changeStatus(PresenceStatus.BREAK, "sofa", 0, NOW.minusSeconds(60));
        when(sessions.findByRoomIdAndUserIdAndEndedAtIsNull(ROOM, ME)).thenReturn(Optional.of(open));

        SessionStatusResponse res = service.changeStatus(ME, ROOM, new ChangeStatusRequest(PresenceStatus.AWAY, "sofa", 2));

        assertThat(res.status()).isEqualTo(PresenceStatus.AWAY);
        assertThat(res.spot()).isNull();
        verify(sessions, never()).findSlotsTakenByOthers(any(), any(), any());
    }

    @Test
    void statusWithoutAnOpenSessionIs404() {
        stubRoom(RoomVisibility.PUBLIC, true);
        when(sessions.findByRoomIdAndUserIdAndEndedAtIsNull(ROOM, ME)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.changeStatus(ME, ROOM, new ChangeStatusRequest(PresenceStatus.FOCUS, null, null)))
                .isInstanceOfSatisfying(NotFoundException.class,
                        e -> assertThat(e.getCode()).isEqualTo("SESSION_NOT_FOUND"));
    }

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

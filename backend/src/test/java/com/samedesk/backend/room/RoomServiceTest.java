package com.samedesk.backend.room;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.samedesk.backend.common.error.BusinessRuleException;
import com.samedesk.backend.common.error.NotFoundException;
import com.samedesk.backend.realtime.RoomEventPublisher;
import com.samedesk.backend.user.User;
import com.samedesk.backend.user.UserRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/** Unit test: repositories and the event publisher are mocks. No Spring, no database. */
class RoomServiceTest {

    private static final Instant NOW = Instant.parse("2026-11-09T10:00:00Z");
    private static final UUID ME = UUID.randomUUID();
    private static final UUID OTHER = UUID.randomUUID();

    private final RoomRepository rooms = mock(RoomRepository.class);
    private final RoomMemberRepository members = mock(RoomMemberRepository.class);
    private final RoomSessionRepository sessions = mock(RoomSessionRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final RoomEventPublisher events = mock(RoomEventPublisher.class);
    private final RoomService service =
            new RoomService(rooms, members, sessions, users, events, Clock.fixed(NOW, ZoneOffset.UTC));

    // ---------- create ----------

    @Test
    void createPublicRoomMakesCallerOwnerWithoutMembership() {
        stubSaveAssignsId();

        RoomResponse res = service.create(ME, new CreateRoomRequest("  Algoritma  ", null, null, null));

        assertThat(res.name()).isEqualTo("Algoritma");
        assertThat(res.visibility()).isEqualTo(RoomVisibility.PUBLIC);
        assertThat(res.maxMembers()).isEqualTo(8);
        assertThat(res.memberCount()).isZero(); // public rooms have no members
        assertThat(res.myRole()).isEqualTo(RoomRole.OWNER);
        assertThat(res.inviteCode()).isNull();
        verify(members, never()).save(any());
    }

    @Test
    void createPrivateRoomGeneratesInviteCodeAndMakesOwnerTheFirstMember() {
        stubSaveAssignsId();

        RoomResponse res = service.create(ME, new CreateRoomRequest("Gizli", "x", RoomVisibility.PRIVATE, 4));

        assertThat(res.maxMembers()).isEqualTo(4);
        assertThat(res.memberCount()).isEqualTo(1);
        assertThat(res.inviteCode()).hasSize(8).matches("[A-HJ-NP-Z2-9]{8}");
        ArgumentCaptor<RoomMember> member = ArgumentCaptor.forClass(RoomMember.class);
        verify(members).save(member.capture());
        assertThat(member.getValue().getRole()).isEqualTo(RoomRole.OWNER);
        assertThat(member.getValue().getSeat()).isZero();
    }

    @Test
    void createBeyondTheRoomLimitIsRefused() {
        when(rooms.countByOwnerId(ME)).thenReturn((long) RoomService.MAX_OWNED_ROOMS);

        assertThatThrownBy(() -> service.create(ME, new CreateRoomRequest("Dördüncü", null, null, null)))
                .isInstanceOfSatisfying(BusinessRuleException.class,
                        e -> assertThat(e.getCode()).isEqualTo("ROOM_LIMIT"));
        verify(rooms, never()).saveAndFlush(any());
    }

    @Test
    void createRejectsBlankNameAfterTrim() {
        assertThatThrownBy(() -> service.create(ME, new CreateRoomRequest("   ", null, null, null)))
                .isInstanceOfSatisfying(BusinessRuleException.class,
                        e -> assertThat(e.getCode()).isEqualTo("ROOM_NAME_BLANK"));
        verify(rooms, never()).saveAndFlush(any());
    }

    // ---------- get ----------

    @Test
    void getUnknownRoomIsNotFound() {
        UUID id = UUID.randomUUID();
        when(rooms.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.get(ME, id))
                .isInstanceOfSatisfying(NotFoundException.class,
                        e -> assertThat(e.getCode()).isEqualTo("ROOM_NOT_FOUND"));
    }

    @Test
    void getPrivateRoomHidesItFromNonMembers() {
        Room room = room(RoomVisibility.PRIVATE, "CODE2345", 4);
        when(rooms.findById(room.getId())).thenReturn(Optional.of(room));
        when(members.findByRoomIdAndUserId(room.getId(), ME)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.get(ME, room.getId()))
                .isInstanceOfSatisfying(NotFoundException.class,
                        e -> assertThat(e.getCode()).isEqualTo("ROOM_NOT_FOUND"));
    }

    @Test
    void getPrivateRoomShowsInviteCodeOnlyToOwner() {
        Room room = room(RoomVisibility.PRIVATE, "CODE2345", 4);
        when(rooms.findById(room.getId())).thenReturn(Optional.of(room));
        when(members.countByRoomId(room.getId())).thenReturn(2L);

        when(members.findByRoomIdAndUserId(room.getId(), OTHER))
                .thenReturn(Optional.of(new RoomMember(room.getId(), OTHER, RoomRole.OWNER, NOW, 0)));
        assertThat(service.get(OTHER, room.getId()).inviteCode()).isEqualTo("CODE2345");

        when(members.findByRoomIdAndUserId(room.getId(), ME))
                .thenReturn(Optional.of(new RoomMember(room.getId(), ME, RoomRole.MEMBER, NOW, 1)));
        RoomResponse asMember = service.get(ME, room.getId());
        assertThat(asMember.inviteCode()).isNull();
        assertThat(asMember.myRole()).isEqualTo(RoomRole.MEMBER);
    }

    @Test
    void getPublicRoomIsOpenToEveryoneAndCountsPeopleInside() {
        Room room = room(RoomVisibility.PUBLIC, null, 4);
        when(rooms.findById(room.getId())).thenReturn(Optional.of(room));
        when(sessions.countByRoomIdAndEndedAtIsNull(room.getId())).thenReturn(3L);

        RoomResponse res = service.get(ME, room.getId());

        assertThat(res.insideCount()).isEqualTo(3);
        assertThat(res.myRole()).isNull();
    }

    // ---------- join ----------

    @Test
    void joinPublicRoomCreatesNoMembership() {
        Room room = room(RoomVisibility.PUBLIC, null, 4);
        when(rooms.findByIdForUpdate(room.getId())).thenReturn(Optional.of(room));

        RoomResponse res = service.join(ME, room.getId(), null);

        assertThat(res.myRole()).isNull();
        verify(members, never()).save(any());
        verify(events, never()).publish(any(), any(), any());
    }

    @Test
    void joinPrivateRoomAddsMemberAtTheLowestFreeSeatAndPublishesEvent() {
        Room room = stubPrivateRoomToJoin(4, 2L);
        when(members.findSeats(room.getId())).thenReturn(List.of(0, 2));

        RoomResponse res = service.join(ME, room.getId(), "CODE2345");

        assertThat(res.myRole()).isEqualTo(RoomRole.MEMBER);
        assertThat(res.memberCount()).isEqualTo(3);
        ArgumentCaptor<RoomMember> saved = ArgumentCaptor.forClass(RoomMember.class);
        verify(members).save(saved.capture());
        assertThat(saved.getValue().getSeat()).isEqualTo(1);
        ArgumentCaptor<Object> payload = ArgumentCaptor.forClass(Object.class);
        verify(events).publish(eq(room.getId().toString()), eq("MEMBER_JOINED"), payload.capture());
        MemberJoinedEvent event = (MemberJoinedEvent) payload.getValue();
        assertThat(event.userId()).isEqualTo(ME);
        assertThat(event.username()).isEqualTo("ada_l");
        assertThat(event.role()).isEqualTo(RoomRole.MEMBER);
    }

    @Test
    void joinWhenAlreadyMemberChangesNothing() {
        Room room = room(RoomVisibility.PRIVATE, "CODE2345", 4);
        when(rooms.findByIdForUpdate(room.getId())).thenReturn(Optional.of(room));
        when(members.findByRoomIdAndUserId(room.getId(), ME))
                .thenReturn(Optional.of(new RoomMember(room.getId(), ME, RoomRole.MEMBER, NOW, 1)));
        when(members.countByRoomId(room.getId())).thenReturn(3L);

        RoomResponse res = service.join(ME, room.getId(), null);

        assertThat(res.myRole()).isEqualTo(RoomRole.MEMBER);
        verify(members, never()).save(any());
        verify(events, never()).publish(any(), any(), any());
    }

    @Test
    void joinFullPrivateRoomIsRejected() {
        Room room = stubPrivateRoomToJoin(2, 2L);

        assertThatThrownBy(() -> service.join(ME, room.getId(), "CODE2345"))
                .isInstanceOfSatisfying(BusinessRuleException.class,
                        e -> assertThat(e.getCode()).isEqualTo("ROOM_FULL"));
        verify(members, never()).save(any());
    }

    @Test
    void joinBeyondTheInviteRoomLimitIsRefused() {
        Room room = stubPrivateRoomToJoin(4, 1L);
        when(members.countByUserIdAndRole(ME, RoomRole.MEMBER)).thenReturn((long) RoomService.MAX_JOINED_ROOMS);

        assertThatThrownBy(() -> service.join(ME, room.getId(), "CODE2345"))
                .isInstanceOfSatisfying(BusinessRuleException.class,
                        e -> assertThat(e.getCode()).isEqualTo("JOIN_LIMIT"));
        verify(members, never()).save(any());
    }

    @Test
    void joinPrivateRoomNeedsRightInviteCode() {
        Room room = stubPrivateRoomToJoin(4, 1L);

        for (String bad : new String[] {null, "", "WRONG999"}) {
            assertThatThrownBy(() -> service.join(ME, room.getId(), bad))
                    .isInstanceOfSatisfying(NotFoundException.class,
                            e -> assertThat(e.getCode()).isEqualTo("ROOM_NOT_FOUND"));
        }
        verify(members, never()).save(any());

        // Codes are typed by hand: case and spaces around it are forgiven.
        assertThat(service.join(ME, room.getId(), "  code2345 ").myRole()).isEqualTo(RoomRole.MEMBER);
    }

    @Test
    void joinByCodeFindsThePrivateRoomAndJoinsIt() {
        Room room = stubPrivateRoomToJoin(4, 1L);
        when(rooms.findByInviteCode("CODE2345")).thenReturn(Optional.of(room));

        // typed by hand: lower case and spaces are forgiven
        RoomResponse res = service.joinByCode(ME, " code 2345 ");

        assertThat(res.id()).isEqualTo(room.getId());
        assertThat(res.myRole()).isEqualTo(RoomRole.MEMBER);
        assertThat(res.inviteCode()).isNull(); // only the owner sees the code
        verify(members).save(any(RoomMember.class));
    }

    @Test
    void joinByUnknownCodeLooksLikeNoRoom() {
        when(rooms.findByInviteCode("WRONG999")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.joinByCode(ME, "wrong999"))
                .isInstanceOfSatisfying(NotFoundException.class,
                        e -> assertThat(e.getCode()).isEqualTo("ROOM_NOT_FOUND"));
        verify(members, never()).save(any());
    }

    @Test
    void normalizeCodeIgnoresTheJvmLocale() {
        Locale before = Locale.getDefault();
        try {
            Locale.setDefault(Locale.forLanguageTag("tr-TR"));
            assertThat(RoomService.normalizeCode(" abc i2 ")).isEqualTo("ABCI2");
        } finally {
            Locale.setDefault(before);
        }
    }

    // ---------- after commit ----------

    @Test
    void joinPublishesOnlyAfterTheTransactionCommits() {
        Room room = stubPrivateRoomToJoin(4, 1L);

        TransactionSynchronizationManager.initSynchronization();
        try {
            service.join(ME, room.getId(), "CODE2345");
            verify(events, never()).publish(any(), any(), any());

            for (TransactionSynchronization sync : TransactionSynchronizationManager.getSynchronizations()) {
                sync.afterCommit();
            }
            verify(events).publish(eq(room.getId().toString()), eq("MEMBER_JOINED"), any());
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void joinDoesNotPublishWhenTheTransactionRollsBack() {
        Room room = stubPrivateRoomToJoin(4, 1L);

        TransactionSynchronizationManager.initSynchronization();
        try {
            service.join(ME, room.getId(), "CODE2345");
            for (TransactionSynchronization sync : TransactionSynchronizationManager.getSynchronizations()) {
                sync.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK);
            }
            verify(events, never()).publish(any(), any(), any());
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    // ---------- leave ----------

    @Test
    void leaveRemovesMemberClosesOpenSessionAndPublishesEvent() {
        Room room = room(RoomVisibility.PRIVATE, "CODE2345", 4);
        RoomMember member = new RoomMember(room.getId(), ME, RoomRole.MEMBER, NOW, 1);
        RoomSession open = new RoomSession(room.getId(), ME, NOW.minusSeconds(600));
        when(rooms.findByIdForUpdate(room.getId())).thenReturn(Optional.of(room));
        when(members.findByRoomIdAndUserId(room.getId(), ME)).thenReturn(Optional.of(member));
        when(users.findById(ME)).thenReturn(Optional.of(new User("a@b.co", "ada_l", "hash", NOW)));
        when(sessions.findByRoomIdAndUserIdAndEndedAtIsNull(room.getId(), ME)).thenReturn(Optional.of(open));

        service.leave(ME, room.getId());

        verify(members).delete(member);
        assertThat(open.isOpen()).isFalse();
        assertThat(open.getEndReason()).isEqualTo(SessionEndReason.LEFT_ROOM);
        assertThat(open.getEndedAt()).isEqualTo(NOW);

        ArgumentCaptor<Object> payload = ArgumentCaptor.forClass(Object.class);
        verify(events).publish(eq(room.getId().toString()), eq("MEMBER_LEFT"), payload.capture());
        MemberLeftEvent event = (MemberLeftEvent) payload.getValue();
        assertThat(event.userId()).isEqualTo(ME);
        assertThat(event.role()).isEqualTo(RoomRole.MEMBER);
    }

    @Test
    void leaveWithoutOpenSessionStillRemovesMember() {
        Room room = room(RoomVisibility.PRIVATE, "CODE2345", 4);
        RoomMember member = new RoomMember(room.getId(), ME, RoomRole.MEMBER, NOW, 1);
        when(rooms.findByIdForUpdate(room.getId())).thenReturn(Optional.of(room));
        when(members.findByRoomIdAndUserId(room.getId(), ME)).thenReturn(Optional.of(member));
        when(users.findById(ME)).thenReturn(Optional.of(new User("a@b.co", "ada_l", "hash", NOW)));
        when(sessions.findByRoomIdAndUserIdAndEndedAtIsNull(room.getId(), ME)).thenReturn(Optional.empty());

        service.leave(ME, room.getId());

        verify(members).delete(member);
    }

    @Test
    void ownerCannotLeave() {
        Room room = room(RoomVisibility.PRIVATE, "CODE2345", 4);
        when(rooms.findByIdForUpdate(room.getId())).thenReturn(Optional.of(room));
        when(members.findByRoomIdAndUserId(room.getId(), ME))
                .thenReturn(Optional.of(new RoomMember(room.getId(), ME, RoomRole.OWNER, NOW, 0)));

        assertThatThrownBy(() -> service.leave(ME, room.getId()))
                .isInstanceOfSatisfying(BusinessRuleException.class,
                        e -> assertThat(e.getCode()).isEqualTo("OWNER_CANNOT_LEAVE"));
        verify(members, never()).delete(any());
        verify(events, never()).publish(any(), any(), any());
    }

    @Test
    void leavingAPublicRoomChangesNothing() {
        Room room = room(RoomVisibility.PUBLIC, null, 4);
        when(rooms.findByIdForUpdate(room.getId())).thenReturn(Optional.of(room));

        service.leave(ME, room.getId());

        verify(members, never()).delete(any());
        verify(events, never()).publish(any(), any(), any());
    }

    @Test
    void leavePrivateRoomAsOutsiderLooksLikeUnknownRoom() {
        Room room = room(RoomVisibility.PRIVATE, "CODE2345", 4);
        when(rooms.findByIdForUpdate(room.getId())).thenReturn(Optional.of(room));
        when(members.findByRoomIdAndUserId(room.getId(), ME)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.leave(ME, room.getId()))
                .isInstanceOfSatisfying(NotFoundException.class,
                        e -> assertThat(e.getCode()).isEqualTo("ROOM_NOT_FOUND"));
    }

    // ---------- delete ----------

    @Test
    void ownerDeletesTheRoomAndPeopleInsideHearAboutIt() {
        Room room = room(RoomVisibility.PUBLIC, null, 4);
        when(rooms.findByIdForUpdate(room.getId())).thenReturn(Optional.of(room));

        service.delete(OTHER, room.getId());

        verify(rooms).delete(room);
        verify(events).publish(eq(room.getId().toString()), eq("ROOM_DELETED"), any());
    }

    @Test
    void someoneElseCannotDeleteTheRoom() {
        Room room = room(RoomVisibility.PUBLIC, null, 4);
        when(rooms.findByIdForUpdate(room.getId())).thenReturn(Optional.of(room));

        assertThatThrownBy(() -> service.delete(ME, room.getId()))
                .isInstanceOfSatisfying(BusinessRuleException.class,
                        e -> assertThat(e.getCode()).isEqualTo("NOT_ROOM_OWNER"));
        verify(rooms, never()).delete(any(Room.class));
    }

    @Test
    void deletingSomeoneElsesPrivateRoomAsOutsiderLooksLikeUnknownRoom() {
        Room room = room(RoomVisibility.PRIVATE, "CODE2345", 4);
        when(rooms.findByIdForUpdate(room.getId())).thenReturn(Optional.of(room));
        when(members.existsByRoomIdAndUserId(room.getId(), ME)).thenReturn(false);

        assertThatThrownBy(() -> service.delete(ME, room.getId())).isInstanceOf(NotFoundException.class);
        verify(rooms, never()).delete(any(Room.class));
    }

    // ---------- list ----------

    @Test
    void listFillsCountsAndMyRoleWithOneLookupEach() {
        Room a = room(RoomVisibility.PUBLIC, null, 8);
        Room b = room(RoomVisibility.PUBLIC, null, 8);
        when(rooms.findByVisibilityOrderByCreatedAtDesc(RoomVisibility.PUBLIC)).thenReturn(List.of(a, b));
        when(sessions.countInsideByRoomIds(anyCollection())).thenReturn(List.of(count(a.getId(), 3)));

        List<RoomResponse> asOwner = service.list(OTHER, RoomScope.PUBLIC);
        List<RoomResponse> asGuest = service.list(ME, RoomScope.PUBLIC);

        assertThat(asOwner).hasSize(2);
        assertThat(asOwner.get(0).insideCount()).isEqualTo(3);
        assertThat(asOwner.get(1).insideCount()).isZero();
        assertThat(asOwner.get(0).myRole()).isEqualTo(RoomRole.OWNER); // public rooms: owner from rooms.owner_id
        assertThat(asGuest.get(0).myRole()).isNull();
    }

    @Test
    void listMineUsesOwnedAndJoinedRooms() {
        Room a = room(RoomVisibility.PRIVATE, "CODE2345", 8);
        when(rooms.findMine(ME)).thenReturn(List.of(a));
        when(members.countByRoomIds(anyCollection())).thenReturn(List.of(count(a.getId(), 2)));
        when(members.findByUserIdAndRoomIdIn(eq(ME), anyCollection()))
                .thenReturn(List.of(new RoomMember(a.getId(), ME, RoomRole.MEMBER, NOW, 1)));

        List<RoomResponse> res = service.list(ME, RoomScope.MINE);

        assertThat(res).singleElement().satisfies(r -> {
            assertThat(r.memberCount()).isEqualTo(2);
            assertThat(r.myRole()).isEqualTo(RoomRole.MEMBER);
            assertThat(r.inviteCode()).isNull();
        });
        verify(rooms, never()).findByVisibilityOrderByCreatedAtDesc(any());
    }

    @Test
    void listWithNoRoomsSkipsOtherQueries() {
        when(rooms.findByVisibilityOrderByCreatedAtDesc(RoomVisibility.PUBLIC)).thenReturn(List.of());

        assertThat(service.list(ME, RoomScope.PUBLIC)).isEmpty();
        verify(members, never()).countByRoomIds(any());
    }

    /** A private room owned by OTHER that ME is about to join with code CODE2345 (memberCount members now). */
    private Room stubPrivateRoomToJoin(int max, long memberCount) {
        Room room = room(RoomVisibility.PRIVATE, "CODE2345", max);
        when(rooms.findByIdForUpdate(room.getId())).thenReturn(Optional.of(room));
        when(members.findByRoomIdAndUserId(room.getId(), ME)).thenReturn(Optional.empty());
        when(members.countByRoomId(room.getId())).thenReturn(memberCount);
        when(members.findSeats(room.getId())).thenReturn(List.of(0));
        when(users.findById(ME)).thenReturn(Optional.of(new User("a@b.co", "ada_l", "hash", NOW)));
        return room;
    }
    // ---------- helpers ----------

    private void stubSaveAssignsId() {
        when(rooms.saveAndFlush(any(Room.class))).thenAnswer(inv -> {
            Room r = inv.getArgument(0);
            setId(r, UUID.randomUUID());
            return r;
        });
    }

    private static Room room(RoomVisibility visibility, String code, int max) {
        Room r = new Room("Oda", null, visibility, code, max, OTHER, NOW);
        setId(r, UUID.randomUUID());
        return r;
    }

    private static void setId(Room room, UUID id) {
        try {
            var f = Room.class.getDeclaredField("id");
            f.setAccessible(true);
            f.set(room, id);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(e);
        }
    }

    private static RoomMemberRepository.RoomCount count(UUID roomId, long total) {
        return new RoomMemberRepository.RoomCount() {
            @Override
            public UUID getRoomId() {
                return roomId;
            }

            @Override
            public long getTotal() {
                return total;
            }
        };
    }
}

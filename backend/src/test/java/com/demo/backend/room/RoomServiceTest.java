package com.demo.backend.room;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.demo.backend.common.error.BusinessRuleException;
import com.demo.backend.common.error.NotFoundException;
import com.demo.backend.realtime.RoomEventPublisher;
import com.demo.backend.user.User;
import com.demo.backend.user.UserRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

/** Unit test: repositories and the event publisher are mocks. No Spring, no database. */
class RoomServiceTest {

    private static final Instant NOW = Instant.parse("2026-11-09T10:00:00Z");
    private static final UUID ME = UUID.randomUUID();
    private static final UUID OTHER = UUID.randomUUID();

    private final RoomRepository rooms = mock(RoomRepository.class);
    private final RoomMemberRepository members = mock(RoomMemberRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final RoomEventPublisher events = mock(RoomEventPublisher.class);
    private final RoomService service =
            new RoomService(rooms, members, users, events, Clock.fixed(NOW, ZoneOffset.UTC));

    // ---------- create ----------

    @Test
    void createUsesDefaultsAndMakesCallerOwner() {
        stubSaveAssignsId();

        RoomResponse res = service.create(ME, new CreateRoomRequest("  Algoritma  ", null, null, null));

        assertThat(res.name()).isEqualTo("Algoritma");
        assertThat(res.visibility()).isEqualTo(RoomVisibility.PUBLIC);
        assertThat(res.maxMembers()).isEqualTo(8);
        assertThat(res.memberCount()).isEqualTo(1);
        assertThat(res.myRole()).isEqualTo(RoomRole.OWNER);
        assertThat(res.inviteCode()).isNull();

        ArgumentCaptor<RoomMember> member = ArgumentCaptor.forClass(RoomMember.class);
        verify(members).save(member.capture());
        assertThat(member.getValue().getUserId()).isEqualTo(ME);
        assertThat(member.getValue().getRole()).isEqualTo(RoomRole.OWNER);
    }

    @Test
    void createPrivateRoomGeneratesInviteCodeForOwner() {
        stubSaveAssignsId();

        RoomResponse res = service.create(ME, new CreateRoomRequest("Gizli", "x", RoomVisibility.PRIVATE, 4));

        assertThat(res.maxMembers()).isEqualTo(4);
        assertThat(res.inviteCode()).hasSize(8).matches("[A-HJ-NP-Z2-9]{8}");
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

        when(members.findByRoomIdAndUserId(room.getId(), ME))
                .thenReturn(Optional.of(new RoomMember(room.getId(), ME, RoomRole.OWNER, NOW)));
        assertThat(service.get(ME, room.getId()).inviteCode()).isEqualTo("CODE2345");

        when(members.findByRoomIdAndUserId(room.getId(), OTHER))
                .thenReturn(Optional.of(new RoomMember(room.getId(), OTHER, RoomRole.MEMBER, NOW)));
        RoomResponse asMember = service.get(OTHER, room.getId());
        assertThat(asMember.inviteCode()).isNull();
        assertThat(asMember.myRole()).isEqualTo(RoomRole.MEMBER);
    }

    // ---------- join ----------

    @Test
    void joinPublicRoomAddsMemberAndPublishesEvent() {
        Room room = room(RoomVisibility.PUBLIC, null, 4);
        when(rooms.findByIdForUpdate(room.getId())).thenReturn(Optional.of(room));
        when(members.findByRoomIdAndUserId(room.getId(), ME)).thenReturn(Optional.empty());
        when(members.countByRoomId(room.getId())).thenReturn(1L);
        when(users.findById(ME)).thenReturn(Optional.of(new User("a@b.co", "ada_l", "hash", NOW)));

        RoomResponse res = service.join(ME, room.getId(), null);

        assertThat(res.myRole()).isEqualTo(RoomRole.MEMBER);
        assertThat(res.memberCount()).isEqualTo(2);
        ArgumentCaptor<Object> payload = ArgumentCaptor.forClass(Object.class);
        verify(events).publish(eq(room.getId().toString()), eq("MEMBER_JOINED"), payload.capture());
        MemberJoinedEvent event = (MemberJoinedEvent) payload.getValue();
        assertThat(event.userId()).isEqualTo(ME);
        assertThat(event.username()).isEqualTo("ada_l");
        assertThat(event.role()).isEqualTo(RoomRole.MEMBER);
    }

    @Test
    void joinWhenAlreadyMemberChangesNothing() {
        Room room = room(RoomVisibility.PUBLIC, null, 4);
        when(rooms.findByIdForUpdate(room.getId())).thenReturn(Optional.of(room));
        when(members.findByRoomIdAndUserId(room.getId(), ME))
                .thenReturn(Optional.of(new RoomMember(room.getId(), ME, RoomRole.OWNER, NOW)));
        when(members.countByRoomId(room.getId())).thenReturn(3L);

        RoomResponse res = service.join(ME, room.getId(), null);

        assertThat(res.myRole()).isEqualTo(RoomRole.OWNER);
        verify(members, never()).save(any());
        verify(events, never()).publish(any(), any(), any());
    }

    @Test
    void joinFullRoomIsRejected() {
        Room room = room(RoomVisibility.PUBLIC, null, 2);
        when(rooms.findByIdForUpdate(room.getId())).thenReturn(Optional.of(room));
        when(members.findByRoomIdAndUserId(room.getId(), ME)).thenReturn(Optional.empty());
        when(members.countByRoomId(room.getId())).thenReturn(2L);

        assertThatThrownBy(() -> service.join(ME, room.getId(), null))
                .isInstanceOfSatisfying(BusinessRuleException.class,
                        e -> assertThat(e.getCode()).isEqualTo("ROOM_FULL"));
        verify(members, never()).save(any());
    }

    @Test
    void joinPrivateRoomNeedsRightInviteCode() {
        Room room = room(RoomVisibility.PRIVATE, "CODE2345", 4);
        when(rooms.findByIdForUpdate(room.getId())).thenReturn(Optional.of(room));
        when(members.findByRoomIdAndUserId(room.getId(), ME)).thenReturn(Optional.empty());
        when(members.countByRoomId(room.getId())).thenReturn(1L);
        when(users.findById(ME)).thenReturn(Optional.of(new User("a@b.co", "ada_l", "hash", NOW)));

        for (String bad : new String[] {null, "", "WRONG999"}) {
            assertThatThrownBy(() -> service.join(ME, room.getId(), bad))
                    .isInstanceOfSatisfying(NotFoundException.class,
                            e -> assertThat(e.getCode()).isEqualTo("ROOM_NOT_FOUND"));
        }
        verify(members, never()).save(any());

        // Codes are typed by hand: case and spaces around it are forgiven.
        assertThat(service.join(ME, room.getId(), "  code2345 ").myRole()).isEqualTo(RoomRole.MEMBER);
    }

    // ---------- list ----------

    @Test
    void listFillsCountsAndMyRoleWithOneLookupEach() {
        Room a = room(RoomVisibility.PUBLIC, null, 8);
        Room b = room(RoomVisibility.PUBLIC, null, 8);
        when(rooms.findByVisibilityOrderByCreatedAtDesc(RoomVisibility.PUBLIC)).thenReturn(List.of(a, b));
        when(members.countByRoomIds(anyCollection())).thenReturn(List.of(count(a.getId(), 3)));
        when(members.findByUserIdAndRoomIdIn(eq(ME), anyCollection()))
                .thenReturn(List.of(new RoomMember(b.getId(), ME, RoomRole.MEMBER, NOW)));

        List<RoomResponse> res = service.list(ME, RoomScope.PUBLIC);

        assertThat(res).hasSize(2);
        assertThat(res.get(0).memberCount()).isEqualTo(3);
        assertThat(res.get(0).myRole()).isNull();
        assertThat(res.get(1).memberCount()).isZero();
        assertThat(res.get(1).myRole()).isEqualTo(RoomRole.MEMBER);
    }

    @Test
    void listMineUsesJoinedRooms() {
        Room a = room(RoomVisibility.PRIVATE, "CODE2345", 8);
        when(rooms.findJoinedBy(ME)).thenReturn(List.of(a));
        when(members.countByRoomIds(anyCollection())).thenReturn(List.of(count(a.getId(), 1)));
        when(members.findByUserIdAndRoomIdIn(eq(ME), anyCollection()))
                .thenReturn(List.of(new RoomMember(a.getId(), ME, RoomRole.OWNER, NOW)));

        List<RoomResponse> res = service.list(ME, RoomScope.MINE);

        assertThat(res).singleElement().satisfies(r -> assertThat(r.inviteCode()).isEqualTo("CODE2345"));
        verify(rooms, never()).findByVisibilityOrderByCreatedAtDesc(any());
    }

    @Test
    void listWithNoRoomsSkipsOtherQueries() {
        when(rooms.findByVisibilityOrderByCreatedAtDesc(RoomVisibility.PUBLIC)).thenReturn(List.of());

        assertThat(service.list(ME, RoomScope.PUBLIC)).isEmpty();
        verify(members, never()).countByRoomIds(any());
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

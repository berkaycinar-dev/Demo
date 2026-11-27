package com.samedesk.backend.room;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class RoomSessionTest {

    private static final Instant START = Instant.parse("2026-11-09T10:00:00Z");

    private RoomSession open() {
        return new RoomSession(UUID.randomUUID(), UUID.randomUUID(), START);
    }

    @Test
    void newSessionIsOpenAndSeenAtStart() {
        RoomSession s = open();

        assertThat(s.isOpen()).isTrue();
        assertThat(s.getLastSeenAt()).isEqualTo(START);
        assertThat(s.getEndReason()).isNull();
        assertThat(s.getStatus()).isEqualTo(PresenceStatus.IDLE);
        assertThat(s.getStatusSince()).isEqualTo(START);
    }

    @Test
    void statusSinceMovesOnlyWhenTheStatusChanges() {
        RoomSession s = open();

        s.changeStatus(PresenceStatus.BREAK, "sofa", 0, START.plusSeconds(60));
        s.changeStatus(PresenceStatus.BREAK, "bar", 1, START.plusSeconds(90)); // another spot, same break

        assertThat(s.getBreakSpot()).isEqualTo("bar");
        assertThat(s.getStatusSince()).isEqualTo(START.plusSeconds(60));
        assertThat(s.getLastSeenAt()).isEqualTo(START.plusSeconds(90));

        s.changeStatus(PresenceStatus.FOCUS, "bar", 1, START.plusSeconds(120));

        assertThat(s.getBreakSpot()).isNull(); // a spot only while on break
        assertThat(s.getStatusSince()).isEqualTo(START.plusSeconds(120));
    }

    @Test
    void closedSessionKeepsItsLastStatus() {
        RoomSession s = open();
        s.end(SessionEndReason.EXIT, START.plusSeconds(30));

        s.changeStatus(PresenceStatus.AWAY, null, null, START.plusSeconds(40));

        assertThat(s.getStatus()).isEqualTo(PresenceStatus.IDLE);
    }

    @Test
    void touchMovesLastSeenForwardOnly() {
        RoomSession s = open();

        s.touch(START.plusSeconds(20));
        s.touch(START.plusSeconds(5));

        assertThat(s.getLastSeenAt()).isEqualTo(START.plusSeconds(20));
    }

    @Test
    void endSetsReasonAndIsFinal() {
        RoomSession s = open();

        s.end(SessionEndReason.EXIT, START.plusSeconds(100));
        s.end(SessionEndReason.TIMEOUT, START.plusSeconds(200));
        s.touch(START.plusSeconds(300));

        assertThat(s.isOpen()).isFalse();
        assertThat(s.getEndReason()).isEqualTo(SessionEndReason.EXIT);
        assertThat(s.getEndedAt()).isEqualTo(START.plusSeconds(100));
        assertThat(s.getLastSeenAt()).isEqualTo(START);
    }

    @Test
    void endNeverGoesBeforeStart() {
        RoomSession s = open();

        s.end(SessionEndReason.EXIT, START.minusSeconds(5));

        assertThat(s.getEndedAt()).isEqualTo(START);
    }
}

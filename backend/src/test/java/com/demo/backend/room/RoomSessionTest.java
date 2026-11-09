package com.demo.backend.room;

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

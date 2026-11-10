package com.demo.backend.point;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.demo.backend.room.RoomSessionRepository;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class RoomSessionPointEligibilityTest {

    private static final UUID ME = UUID.randomUUID();
    private static final Instant AT = Instant.parse("2026-11-10T12:00:00Z");

    private final RoomSessionRepository sessions = mock(RoomSessionRepository.class);
    private final RoomSessionPointEligibility eligibility = new RoomSessionPointEligibility(sessions);

    @Test
    void eligibleWhenASessionCoveredThatMoment() {
        when(sessions.existsActiveAt(ME, AT)).thenReturn(true);

        assertThat(eligibility.isEligible(ME, AT)).isTrue();
    }

    @Test
    void notEligibleWhenNoSessionCoveredThatMoment() {
        when(sessions.existsActiveAt(ME, AT)).thenReturn(false);

        assertThat(eligibility.isEligible(ME, AT)).isFalse();
    }
}

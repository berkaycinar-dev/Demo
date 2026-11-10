package com.demo.backend.point;

import com.demo.backend.room.RoomSessionRepository;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Component;

/** Eligible when the user had an open room session at the moment the block ended. */
@Component
public class RoomSessionPointEligibility implements PointEligibility {

    private final RoomSessionRepository sessions;

    public RoomSessionPointEligibility(RoomSessionRepository sessions) {
        this.sessions = sessions;
    }

    @Override
    public boolean isEligible(UUID userId, Instant at) {
        return sessions.existsActiveAt(userId, at);
    }
}

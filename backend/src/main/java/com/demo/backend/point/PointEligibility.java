package com.demo.backend.point;

import java.time.Instant;
import java.util.UUID;

/**
 * Decides whether a finished focus block counts for points. Kept behind an interface on purpose:
 * today the answer is "the user was inside a room"; the later "at the desk" rule replaces the
 * implementation without touching the point service or the API.
 */
public interface PointEligibility {

    /** @param at the moment the focus block ended (not the moment the server noticed) */
    boolean isEligible(UUID userId, Instant at);
}

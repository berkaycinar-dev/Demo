package com.demo.backend.ping;

import java.time.Clock;
import java.time.Instant;

import org.springframework.stereotype.Service;

/**
 * Service layer: where business rules live. Knows nothing about HTTP.
 *
 * Ping has no real rule; it exists to prove the controller -> service wiring
 * and to show the pattern every later service follows (constructor injection, Clock).
 */
@Service
public class PingService {

    private final Clock clock;

    public PingService(Clock clock) {
        this.clock = clock;
    }

    public PingResponse ping() {
        return new PingResponse("pong", Instant.now(clock));
    }
}

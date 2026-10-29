package com.demo.backend.common.config;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * A single Clock bean for the whole app.
 *
 * Timer, points and league rules all depend on "now". Services must never call
 * Instant.now() directly; they take a Clock instead, so tests can pass
 * Clock.fixed(...) and check time-based rules deterministically.
 */
@Configuration
public class TimeConfig {

    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }
}

package com.demo.backend.common.ratelimit;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class FixedWindowRateLimiterTest {

    /** A clock the test can move forward. */
    static final class MovableClock extends Clock {
        Instant now = Instant.parse("2026-11-25T10:00:00Z");

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }

        void advanceSeconds(long seconds) {
            now = now.plusSeconds(seconds);
        }
    }

    private final MovableClock clock = new MovableClock();
    private final FixedWindowRateLimiter limiter = new FixedWindowRateLimiter(clock, 60);

    @Test
    void allowsUpToLimitThenBlocksWithRetryAfter() {
        for (int i = 0; i < 3; i++) {
            assertThat(limiter.tryAcquire("ip-1", 3)).isZero();
        }
        clock.advanceSeconds(20);
        assertThat(limiter.tryAcquire("ip-1", 3)).isEqualTo(40);
    }

    @Test
    void newWindowStartsCountingAgain() {
        limiter.tryAcquire("ip-1", 1);
        assertThat(limiter.tryAcquire("ip-1", 1)).isPositive();

        clock.advanceSeconds(60);

        assertThat(limiter.tryAcquire("ip-1", 1)).isZero();
    }

    @Test
    void keysAreCountedSeparately() {
        limiter.tryAcquire("ip-1", 1);

        assertThat(limiter.tryAcquire("ip-2", 1)).isZero();
        assertThat(limiter.tryAcquire("ip-1", 1)).isPositive();
    }

    @Test
    void retryAfterIsAtLeastOneSecond() {
        limiter.tryAcquire("ip-1", 1);
        clock.now = clock.now.plusMillis(59_900);

        assertThat(limiter.tryAcquire("ip-1", 1)).isEqualTo(1);
    }

    @Test
    void finishedWindowsAreDroppedWhenManyKeysPileUp() {
        for (int i = 0; i <= FixedWindowRateLimiter.EVICT_THRESHOLD; i++) {
            limiter.tryAcquire("old-" + i, 5);
        }
        clock.advanceSeconds(61);

        limiter.tryAcquire("new", 5);

        assertThat(limiter.size()).isEqualTo(1);
    }
}

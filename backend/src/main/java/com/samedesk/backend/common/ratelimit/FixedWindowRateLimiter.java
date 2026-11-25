package com.samedesk.backend.common.ratelimit;

import java.time.Clock;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Counts requests per key in fixed windows (for example 10 per minute). In memory, so
 * the count is per app instance and starts over after a restart; enough for one server.
 */
public class FixedWindowRateLimiter {

    /** Above this many keys, finished windows are dropped so memory stays bounded. */
    static final int EVICT_THRESHOLD = 10_000;

    private record Window(long startSecond, int count) {
    }

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();
    private final Clock clock;
    private final long windowSeconds;

    public FixedWindowRateLimiter(Clock clock, long windowSeconds) {
        this.clock = clock;
        this.windowSeconds = windowSeconds;
    }

    /**
     * Counts one request for {@code key}.
     *
     * @return 0 when the request is allowed, otherwise the seconds until the window resets (at least 1)
     */
    public long tryAcquire(String key, int limit) {
        long now = clock.instant().getEpochSecond();
        long[] retryAfter = {0};
        windows.compute(key, (k, w) -> {
            if (w == null || now >= w.startSecond() + windowSeconds) {
                return new Window(now, 1);
            }
            if (w.count() >= limit) {
                retryAfter[0] = Math.max(1, w.startSecond() + windowSeconds - now);
                return w;
            }
            return new Window(w.startSecond(), w.count() + 1);
        });
        if (windows.size() > EVICT_THRESHOLD) {
            windows.values().removeIf(w -> now >= w.startSecond() + windowSeconds);
        }
        return retryAfter[0];
    }

    int size() {
        return windows.size();
    }
}

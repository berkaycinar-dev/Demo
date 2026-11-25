package com.demo.backend.common.ratelimit;

import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Settings under {@code app.rate-limit} in application.yml.
 *
 * @param enabled        false turns every limit off
 * @param windowSeconds  length of one counting window
 * @param clientIpHeader header with the caller's IP behind a proxy; blank = TCP peer address
 * @param limits         request path -> allowed POST requests per client IP per window
 */
@ConfigurationProperties(prefix = "app.rate-limit")
public record RateLimitProperties(
        boolean enabled,
        long windowSeconds,
        String clientIpHeader,
        Map<String, Integer> limits) {

    public RateLimitProperties {
        limits = limits == null ? Map.of() : Map.copyOf(limits);
        if (windowSeconds <= 0) {
            windowSeconds = 60;
        }
    }
}

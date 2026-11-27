package com.samedesk.backend.common.ratelimit;

import java.time.Clock;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

/**
 * Registers {@link AuthRateLimitFilter} after Spring Security. Security's CORS filter has then
 * already added the CORS headers, so the browser lets the frontend read a 429.
 * The filter itself only acts on the paths listed in {@code app.rate-limit.limits}; the URL patterns
 * here must cover every one of them.
 */
@Configuration
@EnableConfigurationProperties(RateLimitProperties.class)
public class RateLimitConfig {

    @Bean
    FilterRegistrationBean<AuthRateLimitFilter> authRateLimitFilter(RateLimitProperties props, Clock clock) {
        FixedWindowRateLimiter limiter = new FixedWindowRateLimiter(clock, props.windowSeconds());
        FilterRegistrationBean<AuthRateLimitFilter> registration =
                new FilterRegistrationBean<>(new AuthRateLimitFilter(props, limiter));
        registration.addUrlPatterns("/api/v1/auth/*", "/api/v1/rooms/join-by-code");
        registration.setOrder(Ordered.LOWEST_PRECEDENCE);
        return registration;
    }
}

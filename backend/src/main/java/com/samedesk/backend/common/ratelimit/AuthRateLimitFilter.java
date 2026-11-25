package com.samedesk.backend.common.ratelimit;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Limits POST requests to the public auth endpoints (login, register, refresh, logout)
 * per client IP. Slows down password guessing and mass sign-ups. Over the limit the
 * answer is 429 with code RATE_LIMITED and a Retry-After header.
 */
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private final RateLimitProperties props;
    private final FixedWindowRateLimiter limiter;

    public AuthRateLimitFilter(RateLimitProperties props, FixedWindowRateLimiter limiter) {
        this.props = props;
        this.limiter = limiter;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !props.enabled()
                || !"POST".equals(request.getMethod())
                || !props.limits().containsKey(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        long retryAfter = limiter.tryAcquire(path + "|" + clientIp(request), props.limits().get(path));
        if (retryAfter == 0) {
            chain.doFilter(request, response);
            return;
        }
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setHeader(HttpHeaders.RETRY_AFTER, Long.toString(retryAfter));
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write("{\"type\":\"about:blank\",\"title\":\"Too many requests\",\"status\":429,"
                + "\"detail\":\"Too many requests. Try again in " + retryAfter + " seconds.\","
                + "\"code\":\"RATE_LIMITED\"}");
    }

    /**
     * First address in the configured header (the original caller in X-Forwarded-For),
     * otherwise the TCP peer. A client can fake the header, so behind a proxy this is a
     * best-effort limit, not a security boundary.
     */
    String clientIp(HttpServletRequest request) {
        String header = props.clientIpHeader();
        if (header != null && !header.isBlank()) {
            String value = request.getHeader(header);
            if (value != null) {
                String first = value.split(",", 2)[0].trim();
                if (!first.isEmpty()) {
                    return first;
                }
            }
        }
        return request.getRemoteAddr();
    }
}

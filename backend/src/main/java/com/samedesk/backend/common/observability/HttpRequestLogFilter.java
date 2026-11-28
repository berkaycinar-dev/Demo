package com.samedesk.backend.common.observability;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.slf4j.event.Level;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerMapping;

/** Logs API request metadata, never request bodies, query strings, headers or concrete path values. */
public class HttpRequestLogFilter extends OncePerRequestFilter {

    public static final String REQUEST_ID_HEADER = "X-Request-ID";
    private static final Logger log = LoggerFactory.getLogger(HttpRequestLogFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        // Generate locally instead of trusting an arbitrary identifier supplied by a caller.
        String requestId = UUID.randomUUID().toString();
        String previous = MDC.get("requestId");
        MDC.put("requestId", requestId);
        response.setHeader(REQUEST_ID_HEADER, requestId);
        long started = System.nanoTime();
        boolean completed = false;
        try {
            chain.doFilter(request, response);
            completed = true;
        } finally {
            try {
                int status = !completed && response.getStatus() < 400 ? 500 : response.getStatus();
                long elapsed = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - started);
                Object pattern = request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
                String route = pattern instanceof String value ? value : "unmapped";
                Level level = status >= 500 ? Level.ERROR : status >= 400 ? Level.WARN : Level.INFO;
                log.atLevel(level)
                        .addKeyValue("event", "http.request.completed")
                        .addKeyValue("http_method", request.getMethod())
                        .addKeyValue("http_route", route)
                        .addKeyValue("http_status", status)
                        .addKeyValue("duration_ms", elapsed)
                        .addKeyValue("completion", completed ? "completed" : "exception")
                        .log("HTTP {} {} -> {} ({} ms) requestId={}",
                                request.getMethod(), route, status, elapsed, requestId);
            } finally {
                if (previous == null) MDC.remove("requestId");
                else MDC.put("requestId", previous);
            }
        }
    }
}

package com.samedesk.backend.common.ratelimit;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.servlet.ServletException;
import java.io.IOException;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class AuthRateLimitFilterTest {

    private static final String LOGIN = "/api/v1/auth/login";

    private final FixedWindowRateLimiterTest.MovableClock clock = new FixedWindowRateLimiterTest.MovableClock();

    private AuthRateLimitFilter filter(boolean enabled, String ipHeader) {
        RateLimitProperties props = new RateLimitProperties(enabled, 60, ipHeader, Map.of(LOGIN, 2));
        return new AuthRateLimitFilter(props, new FixedWindowRateLimiter(clock, 60));
    }

    private static MockHttpServletRequest post(String path, String remoteAddr) {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", path);
        request.setRemoteAddr(remoteAddr);
        return request;
    }

    /** Runs the filter once; a 200 means the request reached the next filter. */
    private static MockHttpServletResponse run(AuthRateLimitFilter filter, MockHttpServletRequest request)
            throws ServletException, IOException {
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, new MockFilterChain());
        return response;
    }

    @Test
    void blocksThirdLoginFromSameIpWith429ProblemJson() throws Exception {
        AuthRateLimitFilter filter = filter(true, "");
        run(filter, post(LOGIN, "1.1.1.1"));
        run(filter, post(LOGIN, "1.1.1.1"));

        MockHttpServletResponse response = run(filter, post(LOGIN, "1.1.1.1"));

        assertThat(response.getStatus()).isEqualTo(429);
        assertThat(response.getHeader("Retry-After")).isEqualTo("60");
        assertThat(response.getContentType()).startsWith("application/problem+json");
        assertThat(response.getContentAsString()).contains("\"code\":\"RATE_LIMITED\"", "\"status\":429");
    }

    @Test
    void otherIpIsNotBlocked() throws Exception {
        AuthRateLimitFilter filter = filter(true, "");
        run(filter, post(LOGIN, "1.1.1.1"));
        run(filter, post(LOGIN, "1.1.1.1"));

        assertThat(run(filter, post(LOGIN, "2.2.2.2")).getStatus()).isEqualTo(200);
    }

    @Test
    void ignoresUnlistedPathsAndNonPost() throws Exception {
        AuthRateLimitFilter filter = filter(true, "");
        for (int i = 0; i < 5; i++) {
            assertThat(run(filter, post("/api/v1/rooms", "1.1.1.1")).getStatus()).isEqualTo(200);
            MockHttpServletRequest get = new MockHttpServletRequest("GET", LOGIN);
            assertThat(run(filter, get).getStatus()).isEqualTo(200);
        }
    }

    @Test
    void disabledLetsEverythingThrough() throws Exception {
        AuthRateLimitFilter filter = filter(false, "");
        for (int i = 0; i < 5; i++) {
            assertThat(run(filter, post(LOGIN, "1.1.1.1")).getStatus()).isEqualTo(200);
        }
    }

    @Test
    void behindProxyUsesFirstForwardedAddress() throws Exception {
        AuthRateLimitFilter filter = filter(true, "X-Forwarded-For");
        MockHttpServletRequest request = post(LOGIN, "10.0.0.1");
        request.addHeader("X-Forwarded-For", " 203.0.113.7 , 10.0.0.1");

        assertThat(filter.clientIp(request)).isEqualTo("203.0.113.7");
    }

    @Test
    void behindProxyWithoutHeaderFallsBackToPeerAddress() {
        AuthRateLimitFilter filter = filter(true, "X-Forwarded-For");

        assertThat(filter.clientIp(post(LOGIN, "10.0.0.1"))).isEqualTo("10.0.0.1");
    }

    @Test
    void headerIsIgnoredWhenNotConfigured() {
        AuthRateLimitFilter filter = filter(true, "");
        MockHttpServletRequest request = post(LOGIN, "10.0.0.1");
        request.addHeader("X-Forwarded-For", "203.0.113.7");

        assertThat(filter.clientIp(request)).isEqualTo("10.0.0.1");
    }
}

package com.samedesk.backend.common.observability;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import jakarta.servlet.ServletException;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.servlet.HandlerMapping;

class HttpRequestLogFilterTest {

    private final Logger logger = (Logger) LoggerFactory.getLogger(HttpRequestLogFilter.class);
    private final HttpRequestLogFilter filter = new HttpRequestLogFilter();
    private final ListAppender<ILoggingEvent> capture = new ListAppender<>() {
        @Override
        protected void append(ILoggingEvent event) {
            event.prepareForDeferredProcessing();
            super.append(event);
        }
    };
    private Level previousLevel;
    private boolean previousAdditive;

    @BeforeEach
    void captureLogs() {
        previousLevel = logger.getLevel();
        previousAdditive = logger.isAdditive();
        logger.setLevel(Level.INFO);
        logger.setAdditive(false);
        capture.start();
        logger.addAppender(capture);
    }

    @AfterEach
    void cleanUp() {
        logger.detachAppender(capture);
        capture.stop();
        logger.setLevel(previousLevel);
        logger.setAdditive(previousAdditive);
        MDC.remove("requestId");
    }

    @Test
    void generatesAnIdentifierAvailableToTheRequestAndRestoresThePreviousContext() throws Exception {
        var request = new MockHttpServletRequest("GET", "/api/v1/ping");
        request.addHeader("X-Request-ID", "untrusted-id");
        var response = new MockHttpServletResponse();
        MDC.put("requestId", "outer-context");

        filter.doFilter(request, response, (req, res) -> {
            assertThat(MDC.get("requestId")).isEqualTo(response.getHeader("X-Request-ID"));
            assertThat(UUID.fromString(MDC.get("requestId"))).isNotNull();
        });

        assertThat(MDC.get("requestId")).isEqualTo("outer-context");
        assertThat(response.getHeader("X-Request-ID")).isNotEqualTo("untrusted-id");
        assertThat(capture.list.getFirst().getMDCPropertyMap().get("requestId"))
                .isEqualTo(response.getHeader("X-Request-ID"));
    }

    @Test
    void logsOnlyTheRouteTemplateAndMetadataWithoutRequestSecrets() throws Exception {
        var request = new MockHttpServletRequest("POST", "/api/v1/rooms/private-path-secret");
        request.setQueryString("token=query-secret");
        request.addHeader("Authorization", "Bearer bearer-secret");
        request.addHeader("Cookie", "session=cookie-secret");
        request.setContent("{\"password\":\"body-secret\"}".getBytes());
        request.setAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE, "/api/v1/rooms/{roomId}");
        var response = new MockHttpServletResponse();

        filter.doFilter(request, response, (req, res) -> response.setStatus(404));

        var event = capture.list.getFirst();
        assertThat(event.getLevel()).isEqualTo(Level.WARN);
        assertThat(fields(event)).containsEntry("http_route", "/api/v1/rooms/{roomId}")
                .containsEntry("http_status", 404).containsEntry("event", "http.request.completed");
        assertThat((Long) fields(event).get("duration_ms")).isGreaterThanOrEqualTo(0L);
        assertThat(event.getFormattedMessage() + fields(event))
                .doesNotContain("private-path-secret", "query-secret", "bearer-secret", "cookie-secret", "body-secret");
        assertThat(MDC.get("requestId")).isNull();
    }

    @Test
    void securityRejectionWithoutAMatchedControllerUsesUnmappedAndKeepsItsStatus() throws Exception {
        var response = new MockHttpServletResponse();
        filter.doFilter(new MockHttpServletRequest("GET", "/api/v1/users/me"), response,
                (req, res) -> response.setStatus(401));

        assertThat(fields(capture.list.getFirst())).containsEntry("http_route", "unmapped")
                .containsEntry("http_status", 401);
        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getHeader("X-Request-ID")).isNotBlank();
    }

    @Test
    void uncaughtFailureIsLoggedAndRethrownWithoutLeakingTheContextOrExceptionDetails() {
        var response = new MockHttpServletResponse();
        assertThatThrownBy(() -> filter.doFilter(new MockHttpServletRequest("GET", "/api/v1/ping"), response,
                (req, res) -> { throw new ServletException("exception-secret"); }))
                .isInstanceOf(ServletException.class);

        var event = capture.list.getFirst();
        assertThat(event.getLevel()).isEqualTo(Level.ERROR);
        assertThat(fields(event)).containsEntry("http_status", 500).containsEntry("completion", "exception");
        assertThat(event.getThrowableProxy()).isNull();
        assertThat(event.getFormattedMessage()).doesNotContain("exception-secret");
        assertThat(MDC.get("requestId")).isNull();
    }

    @Test
    void sequentialRequestsOnTheSameThreadGetDistinctIdentifiers() throws Exception {
        var first = new MockHttpServletResponse();
        var second = new MockHttpServletResponse();
        filter.doFilter(new MockHttpServletRequest("GET", "/api/v1/ping"), first, (req, res) -> {});
        filter.doFilter(new MockHttpServletRequest("GET", "/api/v1/ping"), second, (req, res) -> {});

        assertThat(first.getHeader("X-Request-ID")).isNotEqualTo(second.getHeader("X-Request-ID"));
        assertThat(capture.list).hasSize(2);
        assertThat(MDC.get("requestId")).isNull();
    }

    private Map<String, Object> fields(ILoggingEvent event) {
        return event.getKeyValuePairs().stream().collect(Collectors.toMap(pair -> pair.key, pair -> pair.value));
    }
}

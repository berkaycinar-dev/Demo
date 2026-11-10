package com.demo.backend.point;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.demo.backend.common.error.GlobalExceptionHandler;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

/** Standalone MockMvc, same setup as TimerControllerTest: checks status codes and JSON from openapi.yaml. */
class PointControllerTest {

    private static final UUID ME = UUID.randomUUID();
    private static final Instant NOW = Instant.parse("2026-11-10T13:00:00Z");

    private final PointService pointService = mock(PointService.class);
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        HandlerMethodArgumentResolver jwtResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return Jwt.class.equals(parameter.getParameterType());
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mav,
                                          NativeWebRequest request, WebDataBinderFactory binderFactory) {
                return Jwt.withTokenValue("t").header("alg", "HS256").subject(ME.toString()).build();
            }
        };
        mockMvc = MockMvcBuilders.standaloneSetup(new PointController(pointService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(jwtResolver)
                .build();
    }

    @Test
    void summaryReturnsContractFields() throws Exception {
        when(pointService.summary(ME)).thenReturn(new PointSummaryResponse(170, 60, 3, 6000, NOW));

        mockMvc.perform(get("/api/v1/points/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalPoints").value(170))
                .andExpect(jsonPath("$.todayPoints").value(60))
                .andExpect(jsonPath("$.completedBlocks").value(3))
                .andExpect(jsonPath("$.focusSeconds").value(6000))
                .andExpect(jsonPath("$.serverTime").exists());
    }

    @Test
    void eventsReturnAPageWithContractFields() throws Exception {
        UUID id = UUID.randomUUID();
        PointEventResponse item = new PointEventResponse(id, PointKind.FOCUS_BLOCK, 60, 50, 10, 3000, "50-10", NOW);
        when(pointService.history(ME, 1, 5)).thenReturn(new PointEventPage(List.of(item), 1, 5, 6, 2));

        mockMvc.perform(get("/api/v1/points/me/events").param("page", "1").param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value(id.toString()))
                .andExpect(jsonPath("$.items[0].kind").value("FOCUS_BLOCK"))
                .andExpect(jsonPath("$.items[0].points").value(60))
                .andExpect(jsonPath("$.items[0].basePoints").value(50))
                .andExpect(jsonPath("$.items[0].bonusPoints").value(10))
                .andExpect(jsonPath("$.items[0].focusSeconds").value(3000))
                .andExpect(jsonPath("$.items[0].preset").value("50-10"))
                .andExpect(jsonPath("$.items[0].earnedAt").exists())
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.size").value(5))
                .andExpect(jsonPath("$.totalItems").value(6))
                .andExpect(jsonPath("$.totalPages").value(2));
    }

    @Test
    void eventsUseDefaultsWhenNoParametersAreGiven() throws Exception {
        when(pointService.history(ME, 0, 20)).thenReturn(new PointEventPage(List.of(), 0, 20, 0, 0));

        mockMvc.perform(get("/api/v1/points/me/events"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isEmpty());

        verify(pointService).history(ME, 0, 20);
    }
}

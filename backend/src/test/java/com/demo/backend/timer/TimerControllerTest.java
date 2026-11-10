package com.demo.backend.timer;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.demo.backend.common.error.BusinessRuleException;
import com.demo.backend.common.error.GlobalExceptionHandler;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

/** Standalone MockMvc, same setup as RoomControllerTest: checks status codes and JSON from openapi.yaml. */
class TimerControllerTest {

    private static final UUID ME = UUID.randomUUID();
    private static final UUID COMMAND = UUID.randomUUID();
    private static final Instant NOW = Instant.parse("2026-11-10T10:00:00Z");

    private final TimerService timerService = mock(TimerService.class);
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
        mockMvc = MockMvcBuilders.standaloneSetup(new TimerController(timerService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(jwtResolver)
                .build();
    }

    private static TimerStateResponse running() {
        return new TimerStateResponse("25-5", TimerPhase.FOCUS, TimerStatus.RUNNING, NOW.plusSeconds(1500),
                1500, 1500, 1, 0, NOW);
    }

    @Test
    void getReturnsTheTimerWithContractFields() throws Exception {
        when(timerService.get(ME)).thenReturn(running());

        mockMvc.perform(get("/api/v1/timer"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.preset").value("25-5"))
                .andExpect(jsonPath("$.phase").value("FOCUS"))
                .andExpect(jsonPath("$.status").value("RUNNING"))
                .andExpect(jsonPath("$.endsAt").exists())
                .andExpect(jsonPath("$.remainingSeconds").value(1500))
                .andExpect(jsonPath("$.totalSeconds").value(1500))
                .andExpect(jsonPath("$.version").value(1))
                .andExpect(jsonPath("$.completedFocusBlocks").value(0))
                .andExpect(jsonPath("$.serverTime").exists());
    }

    @Test
    void commandPassesTheRequestToTheService() throws Exception {
        when(timerService.execute(eq(ME), any(TimerCommandRequest.class))).thenReturn(running());

        mockMvc.perform(post("/api/v1/timer/commands")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"commandId\":\"" + COMMAND + "\",\"expectedVersion\":0,\"type\":\"START\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RUNNING"));

        verify(timerService).execute(ME, new TimerCommandRequest(COMMAND, 0L, TimerCommandType.START, null));
    }

    @Test
    void setPresetCarriesThePreset() throws Exception {
        when(timerService.execute(eq(ME), any(TimerCommandRequest.class))).thenReturn(running());

        mockMvc.perform(post("/api/v1/timer/commands")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"commandId\":\"" + COMMAND
                                + "\",\"expectedVersion\":3,\"type\":\"SET_PRESET\",\"preset\":\"50-10\"}"))
                .andExpect(status().isOk());

        verify(timerService).execute(ME, new TimerCommandRequest(COMMAND, 3L, TimerCommandType.SET_PRESET, "50-10"));
    }

    @Test
    void missingCommandIdReturns400WithValidationError() throws Exception {
        mockMvc.perform(post("/api/v1/timer/commands")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"expectedVersion\":0,\"type\":\"START\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fieldErrors.commandId").exists());
    }

    @Test
    void negativeVersionReturns400() throws Exception {
        mockMvc.perform(post("/api/v1/timer/commands")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"commandId\":\"" + COMMAND + "\",\"expectedVersion\":-1,\"type\":\"START\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.expectedVersion").exists());
    }

    @Test
    void unknownCommandTypeReturns400() throws Exception {
        mockMvc.perform(post("/api/v1/timer/commands")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"commandId\":\"" + COMMAND + "\",\"expectedVersion\":0,\"type\":\"EXPLODE\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void staleVersionReturns409() throws Exception {
        when(timerService.execute(eq(ME), any(TimerCommandRequest.class)))
                .thenThrow(new BusinessRuleException("STALE_VERSION", "The timer changed. Read it again."));

        mockMvc.perform(post("/api/v1/timer/commands")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"commandId\":\"" + COMMAND + "\",\"expectedVersion\":0,\"type\":\"START\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("STALE_VERSION"));
    }

    @Test
    void invalidTransitionReturns409() throws Exception {
        when(timerService.execute(eq(ME), any(TimerCommandRequest.class)))
                .thenThrow(new BusinessRuleException("INVALID_TIMER_TRANSITION", "PAUSE is not possible."));

        mockMvc.perform(post("/api/v1/timer/commands")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"commandId\":\"" + COMMAND + "\",\"expectedVersion\":0,\"type\":\"PAUSE\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("INVALID_TIMER_TRANSITION"));
    }
}

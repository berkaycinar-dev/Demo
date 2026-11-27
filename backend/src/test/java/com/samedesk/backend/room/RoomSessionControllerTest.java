package com.samedesk.backend.room;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.samedesk.backend.common.error.BusinessRuleException;
import com.samedesk.backend.common.error.GlobalExceptionHandler;
import com.samedesk.backend.common.error.NotFoundException;
import java.time.Instant;
import java.util.List;
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
class RoomSessionControllerTest {

    private static final UUID ME = UUID.randomUUID();
    private static final UUID ROOM = UUID.randomUUID();
    private static final String BASE = "/api/v1/rooms/" + ROOM + "/sessions";

    private final RoomSessionService sessionService = mock(RoomSessionService.class);
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
        mockMvc = MockMvcBuilders.standaloneSetup(new RoomSessionController(sessionService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(jwtResolver)
                .build();
    }

    @Test
    void enterReturns200WithContractShape() throws Exception {
        Instant now = Instant.parse("2026-11-09T10:00:00Z");
        when(sessionService.enter(ME, ROOM))
                .thenReturn(new RoomSessionResponse(UUID.randomUUID(), ROOM, now, now));

        mockMvc.perform(post(BASE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roomId").value(ROOM.toString()))
                .andExpect(jsonPath("$.startedAt").exists())
                .andExpect(jsonPath("$.lastSeenAt").exists());
    }

    @Test
    void enterWithoutMembershipReturns409() throws Exception {
        when(sessionService.enter(ME, ROOM))
                .thenThrow(new BusinessRuleException("NOT_A_MEMBER", "Join the room before entering it."));

        mockMvc.perform(post(BASE))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("NOT_A_MEMBER"));
    }

    @Test
    void heartbeatReturns204() throws Exception {
        mockMvc.perform(post(BASE + "/current/heartbeat"))
                .andExpect(status().isNoContent());
        verify(sessionService).heartbeat(ME, ROOM);
    }

    @Test
    void heartbeatWithoutOpenSessionReturns404() throws Exception {
        doThrow(new NotFoundException("SESSION_NOT_FOUND", "No open session in this room."))
                .when(sessionService).heartbeat(ME, ROOM);

        mockMvc.perform(post(BASE + "/current/heartbeat"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("SESSION_NOT_FOUND"));
    }

    @Test
    void exitReturns204() throws Exception {
        mockMvc.perform(delete(BASE + "/current"))
                .andExpect(status().isNoContent());
        verify(sessionService).exit(ME, ROOM);
    }

    @Test
    void activeReturnsPeopleInside() throws Exception {
        when(sessionService.active(ME, ROOM)).thenReturn(List.of(
                new ActiveMemberResponse(ME, "ada_l", RoomRole.MEMBER, Instant.parse("2026-11-09T10:00:00Z"),
                        "{\"body\":\"female\",\"bangs\":true}", 0, PresenceStatus.BREAK, "sofa", 1,
                        Instant.parse("2026-11-09T10:05:00Z"), true),
                // a private room's member who is not inside: away at their seat
                new ActiveMemberResponse(UUID.randomUUID(), "bob_b", RoomRole.MEMBER,
                        null, null, 1, PresenceStatus.AWAY, null, null,
                        Instant.parse("2026-11-09T10:01:00Z"), false)));

        mockMvc.perform(get(BASE + "/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].userId").value(ME.toString()))
                .andExpect(jsonPath("$[0].username").value("ada_l"))
                .andExpect(jsonPath("$[0].role").value("MEMBER"))
                .andExpect(jsonPath("$[0].startedAt").exists())
                // the avatar is a JSON object, not a string holding JSON
                .andExpect(jsonPath("$[0].avatar.body").value("female"))
                .andExpect(jsonPath("$[0].avatar.bangs").value(true))
                .andExpect(jsonPath("$[0].status").value("BREAK"))
                .andExpect(jsonPath("$[0].spot").value("sofa"))
                .andExpect(jsonPath("$[0].slot").value(1))
                .andExpect(jsonPath("$[0].seat").value(0))
                .andExpect(jsonPath("$[0].statusSince").exists())
                .andExpect(jsonPath("$[1].avatar").isEmpty())
                .andExpect(jsonPath("$[1].status").value("AWAY"))
                .andExpect(jsonPath("$[0].online").value(true))
                .andExpect(jsonPath("$[1].online").value(false))
                .andExpect(jsonPath("$[1].startedAt").isEmpty());
    }

    @Test
    void changeStatusReturnsTheNewStatus() throws Exception {
        ChangeStatusRequest body = new ChangeStatusRequest(PresenceStatus.BREAK, "sofa", 2);
        when(sessionService.changeStatus(ME, ROOM, body)).thenReturn(
                new SessionStatusResponse(PresenceStatus.BREAK, "sofa", 1, Instant.parse("2026-11-09T10:05:00Z")));

        mockMvc.perform(put(BASE + "/current/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"BREAK\",\"spot\":\"sofa\",\"spotCapacity\":2}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("BREAK"))
                .andExpect(jsonPath("$.spot").value("sofa"));
        verify(sessionService).changeStatus(ME, ROOM, body);
    }

    @Test
    void changeStatusToAFullSpotReturns409() throws Exception {
        when(sessionService.changeStatus(ME, ROOM, new ChangeStatusRequest(PresenceStatus.BREAK, "sofa", 1)))
                .thenThrow(new BusinessRuleException("SPOT_TAKEN", "This break spot is full."));

        mockMvc.perform(put(BASE + "/current/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"BREAK\",\"spot\":\"sofa\",\"spotCapacity\":1}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("SPOT_TAKEN"));
    }

    @Test
    void changeStatusRejectsUnknownStatusAndOddSpotIds() throws Exception {
        mockMvc.perform(put(BASE + "/current/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"BREAK\",\"spot\":\"so fa!\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
        mockMvc.perform(put(BASE + "/current/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"spot\":\"sofa\"}"))
                .andExpect(status().isBadRequest());
    }
}

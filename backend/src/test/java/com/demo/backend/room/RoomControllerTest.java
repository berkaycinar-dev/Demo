package com.demo.backend.room;

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
import com.demo.backend.common.error.NotFoundException;
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

/**
 * Standalone MockMvc: only the controller + our error handler, no Spring context, no security filter.
 * A tiny resolver supplies the signed-in user (the Jwt parameter). Checks the HTTP contract
 * (status codes, JSON field names, error codes) from contracts/openapi.yaml.
 */
class RoomControllerTest {

    private static final UUID ME = UUID.randomUUID();
    private static final UUID ROOM = UUID.randomUUID();

    private final RoomService roomService = mock(RoomService.class);
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
        mockMvc = MockMvcBuilders.standaloneSetup(new RoomController(roomService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(jwtResolver)
                .build();
    }

    private static RoomResponse sample(RoomRole role, String code) {
        return new RoomResponse(ROOM, "Algoritma", null, RoomVisibility.PRIVATE, 6, 1, ME, role, code,
                Instant.parse("2026-11-09T10:00:00Z"));
    }

    @Test
    void createReturns201WithContractShape() throws Exception {
        when(roomService.create(eq(ME), any())).thenReturn(sample(RoomRole.OWNER, "CODE2345"));

        mockMvc.perform(post("/api/v1/rooms")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Algoritma\",\"visibility\":\"PRIVATE\",\"maxMembers\":6}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(ROOM.toString()))
                .andExpect(jsonPath("$.name").value("Algoritma"))
                .andExpect(jsonPath("$.visibility").value("PRIVATE"))
                .andExpect(jsonPath("$.maxMembers").value(6))
                .andExpect(jsonPath("$.memberCount").value(1))
                .andExpect(jsonPath("$.myRole").value("OWNER"))
                .andExpect(jsonPath("$.inviteCode").value("CODE2345"))
                .andExpect(jsonPath("$.ownerId").value(ME.toString()));
    }

    @Test
    void createWithBadBodyReturns400() throws Exception {
        mockMvc.perform(post("/api/v1/rooms")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\",\"maxMembers\":11}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void listDefaultsToPublicScope() throws Exception {
        when(roomService.list(ME, RoomScope.PUBLIC)).thenReturn(List.of(sample(null, null)));

        mockMvc.perform(get("/api/v1/rooms"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Algoritma"));
        verify(roomService).list(ME, RoomScope.PUBLIC);
    }

    @Test
    void listAcceptsMineScope() throws Exception {
        when(roomService.list(ME, RoomScope.MINE)).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/rooms").param("scope", "MINE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void getUnknownRoomReturns404WithRoomNotFoundCode() throws Exception {
        when(roomService.get(ME, ROOM)).thenThrow(new NotFoundException("ROOM_NOT_FOUND", "Room not found."));

        mockMvc.perform(get("/api/v1/rooms/" + ROOM))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("ROOM_NOT_FOUND"));
    }

    @Test
    void joinWithoutBodyIsAllowedForPublicRooms() throws Exception {
        when(roomService.join(ME, ROOM, null)).thenReturn(sample(RoomRole.MEMBER, null));

        mockMvc.perform(post("/api/v1/rooms/" + ROOM + "/join"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.myRole").value("MEMBER"))
                .andExpect(jsonPath("$.inviteCode").doesNotExist());
    }

    @Test
    void joinPassesInviteCodeToService() throws Exception {
        when(roomService.join(ME, ROOM, "CODE2345")).thenReturn(sample(RoomRole.MEMBER, null));

        mockMvc.perform(post("/api/v1/rooms/" + ROOM + "/join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"inviteCode\":\"CODE2345\"}"))
                .andExpect(status().isOk());
        verify(roomService).join(ME, ROOM, "CODE2345");
    }

    @Test
    void joinFullRoomReturns409() throws Exception {
        when(roomService.join(ME, ROOM, null)).thenThrow(new BusinessRuleException("ROOM_FULL", "Room is full."));

        mockMvc.perform(post("/api/v1/rooms/" + ROOM + "/join"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ROOM_FULL"));
    }
}

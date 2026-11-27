package com.samedesk.backend.user;

import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.samedesk.backend.common.error.BusinessRuleException;
import com.samedesk.backend.common.error.GlobalExceptionHandler;
import java.time.Instant;
import java.util.Map;
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

/** Standalone MockMvc, same setup as RoomSessionControllerTest. */
class UserControllerTest {

    private static final UUID ME = UUID.randomUUID();

    private final UserService userService = mock(UserService.class);
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
        mockMvc = MockMvcBuilders.standaloneSetup(new UserController(userService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(jwtResolver)
                .build();
    }

    @Test
    void changeAvatarReturnsTheUserWithTheAvatarObject() throws Exception {
        when(userService.changeAvatar(eq(ME), anyMap())).thenReturn(new UserResponse(ME, "ada@example.com", "ada_l",
                Instant.parse("2026-11-07T10:00:00Z"), "{\"bangs\":true,\"body\":\"female\"}"));

        mockMvc.perform(put("/api/v1/users/me/avatar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"body\":\"female\",\"bangs\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("ada_l"))
                .andExpect(jsonPath("$.avatar.body").value("female"))
                .andExpect(jsonPath("$.avatar.bangs").value(true));
        verify(userService).changeAvatar(ME, Map.of("body", "female", "bangs", true));
    }

    @Test
    void invalidAvatarReturns409WithCode() throws Exception {
        when(userService.changeAvatar(eq(ME), anyMap()))
                .thenThrow(new BusinessRuleException("INVALID_AVATAR", "Avatar values are text or true/false."));

        mockMvc.perform(put("/api/v1/users/me/avatar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"hat\":{\"id\":\"cap\"}}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("INVALID_AVATAR"));
    }
}

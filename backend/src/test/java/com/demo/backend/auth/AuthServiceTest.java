package com.demo.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.demo.backend.common.error.BusinessRuleException;
import com.demo.backend.common.error.UnauthorizedException;
import com.demo.backend.user.User;
import com.demo.backend.user.UserRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.password.PasswordEncoder;

/** Unit test: repository, token service and password encoder are mocks. */
class AuthServiceTest {

    private static final Instant NOW = Instant.parse("2026-11-07T10:00:00Z");

    private final UserRepository users = mock(UserRepository.class);
    private final PasswordEncoder encoder = mock(PasswordEncoder.class);
    private final TokenService tokens = mock(TokenService.class);
    private final AuthService service;

    AuthServiceTest() {
        when(encoder.encode(anyString())).thenAnswer(inv -> "hashed:" + inv.getArgument(0));
        when(tokens.createAccessToken(any(), anyString())).thenReturn("access-jwt");
        when(tokens.issueRefreshToken(any())).thenReturn("refresh-raw");
        when(tokens.accessTtlSeconds()).thenReturn(900L);
        service = new AuthService(users, encoder, tokens, Clock.fixed(NOW, ZoneOffset.UTC));
    }

    @Test
    void registerLowercasesEmailHashesPasswordAndReturnsTokens() {
        when(users.saveAndFlush(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        AuthResponse res = service.register(new RegisterRequest("  Ada@Example.COM ", "ada_l", "password123"));

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(users).saveAndFlush(saved.capture());
        assertThat(saved.getValue().getEmail()).isEqualTo("ada@example.com");
        assertThat(saved.getValue().getPasswordHash()).isEqualTo("hashed:password123");
        assertThat(saved.getValue().getCreatedAt()).isEqualTo(NOW);
        assertThat(res.accessToken()).isEqualTo("access-jwt");
        assertThat(res.refreshToken()).isEqualTo("refresh-raw");
        assertThat(res.tokenType()).isEqualTo("Bearer");
        assertThat(res.expiresIn()).isEqualTo(900);
        assertThat(res.user().username()).isEqualTo("ada_l");
    }

    @Test
    void registerRejectsTakenEmail() {
        when(users.existsByEmail("ada@example.com")).thenReturn(true);

        assertThatThrownBy(() -> service.register(new RegisterRequest("ada@example.com", "ada_l", "password123")))
                .isInstanceOfSatisfying(BusinessRuleException.class,
                        e -> assertThat(e.getCode()).isEqualTo("EMAIL_TAKEN"));
        verify(users, never()).saveAndFlush(any());
    }

    @Test
    void registerRejectsTakenUsernameIgnoringCase() {
        when(users.existsByUsernameIgnoreCase("Ada_L")).thenReturn(true);

        assertThatThrownBy(() -> service.register(new RegisterRequest("new@example.com", "Ada_L", "password123")))
                .isInstanceOfSatisfying(BusinessRuleException.class,
                        e -> assertThat(e.getCode()).isEqualTo("USERNAME_TAKEN"));
    }

    @Test
    void registerRejectsPasswordLongerThan72Bytes() {
        // 40 chars but 80 bytes: passes the 72-char bean validation, must fail the byte check.
        String password = "ş".repeat(40);

        assertThatThrownBy(() -> service.register(new RegisterRequest("a@b.co", "ada_l", password)))
                .isInstanceOfSatisfying(BusinessRuleException.class,
                        e -> assertThat(e.getCode()).isEqualTo("PASSWORD_TOO_LONG"));
    }

    @Test
    void loginSucceedsWithCorrectPassword() {
        User user = new User("ada@example.com", "ada_l", "hash", NOW);
        when(users.findByEmail("ada@example.com")).thenReturn(Optional.of(user));
        when(encoder.matches("password123", "hash")).thenReturn(true);

        AuthResponse res = service.login(new LoginRequest("Ada@Example.com", "password123"));

        assertThat(res.accessToken()).isEqualTo("access-jwt");
    }

    @Test
    void loginWithWrongPasswordAndUnknownEmailGiveSameError() {
        User user = new User("ada@example.com", "ada_l", "hash", NOW);
        when(users.findByEmail("ada@example.com")).thenReturn(Optional.of(user));
        when(users.findByEmail("ghost@example.com")).thenReturn(Optional.empty());
        when(encoder.matches(anyString(), anyString())).thenReturn(false);

        for (String email : new String[] {"ada@example.com", "ghost@example.com"}) {
            assertThatThrownBy(() -> service.login(new LoginRequest(email, "wrong-password")))
                    .isInstanceOfSatisfying(UnauthorizedException.class,
                            e -> assertThat(e.getCode()).isEqualTo("INVALID_CREDENTIALS"));
        }
    }

    @Test
    void refreshIssuesNewPair() {
        UUID id = UUID.randomUUID();
        User user = new User("ada@example.com", "ada_l", "hash", NOW);
        when(tokens.consumeRefreshToken("old")).thenReturn(id);
        when(users.findById(id)).thenReturn(Optional.of(user));

        AuthResponse res = service.refresh(new RefreshRequest("old"));

        assertThat(res.refreshToken()).isEqualTo("refresh-raw");
    }

    @Test
    void refreshFailsWhenUserWasDeleted() {
        UUID id = UUID.randomUUID();
        when(tokens.consumeRefreshToken("old")).thenReturn(id);
        when(users.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.refresh(new RefreshRequest("old")))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void logoutRevokesToken() {
        service.logout(new RefreshRequest("tok"));

        verify(tokens).revokeRefreshToken("tok");
    }
}

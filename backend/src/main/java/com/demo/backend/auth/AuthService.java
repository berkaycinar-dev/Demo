package com.demo.backend.auth;

import com.demo.backend.common.error.BusinessRuleException;
import com.demo.backend.common.error.UnauthorizedException;
import com.demo.backend.user.User;
import com.demo.backend.user.UserRepository;
import com.demo.backend.user.UserResponse;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.util.Locale;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Business rules for register, login, refresh, logout and "who am I". */
@Service
public class AuthService {

    /** BCrypt only looks at the first 72 bytes, so longer passwords are refused instead of cut. */
    static final int MAX_PASSWORD_BYTES = 72;

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokens;
    private final Clock clock;
    /** Hash of a throw-away password. Login compares against it when the email is unknown, so timing stays similar. */
    private final String dummyHash;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder, TokenService tokens, Clock clock) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.tokens = tokens;
        this.clock = clock;
        this.dummyHash = passwordEncoder.encode("not-a-real-password");
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (request.password().getBytes(StandardCharsets.UTF_8).length > MAX_PASSWORD_BYTES) {
            throw new BusinessRuleException("PASSWORD_TOO_LONG", "Password must be at most 72 bytes.");
        }
        String email = normalizeEmail(request.email());
        String username = request.username();

        if (users.existsByEmail(email)) {
            throw new BusinessRuleException("EMAIL_TAKEN", "This email is already registered.");
        }
        if (users.existsByUsernameIgnoreCase(username)) {
            throw new BusinessRuleException("USERNAME_TAKEN", "This username is already taken.");
        }

        User user;
        try {
            // saveAndFlush: a race with another request shows up here as a unique violation.
            user = users.saveAndFlush(new User(email, username, passwordEncoder.encode(request.password()), clock.instant()));
        } catch (DataIntegrityViolationException e) {
            boolean emailClash = String.valueOf(e.getMostSpecificCause().getMessage()).contains("users_email_key");
            throw emailClash
                    ? new BusinessRuleException("EMAIL_TAKEN", "This email is already registered.")
                    : new BusinessRuleException("USERNAME_TAKEN", "This username is already taken.");
        }
        return issueTokens(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = users.findByEmail(normalizeEmail(request.email())).orElse(null);
        String hash = user != null ? user.getPasswordHash() : dummyHash;
        boolean matches = passwordEncoder.matches(request.password(), hash);
        if (user == null || !matches) {
            // Same answer for "no such email" and "wrong password": do not leak which emails exist.
            throw new UnauthorizedException("INVALID_CREDENTIALS", "Email or password is wrong.");
        }
        return issueTokens(user);
    }

    /** Swaps a valid refresh token for a new pair. The old refresh token cannot be used again. */
    @Transactional
    public AuthResponse refresh(RefreshRequest request) {
        UUID userId = tokens.consumeRefreshToken(request.refreshToken());
        User user = users.findById(userId)
                .orElseThrow(() -> new UnauthorizedException(TokenService.REFRESH_INVALID, "Refresh token is invalid."));
        return issueTokens(user);
    }

    @Transactional
    public void logout(RefreshRequest request) {
        tokens.revokeRefreshToken(request.refreshToken());
    }

    @Transactional(readOnly = true)
    public UserResponse me(UUID userId) {
        return users.findById(userId)
                .map(UserResponse::from)
                .orElseThrow(() -> new UnauthorizedException("UNAUTHENTICATED", "Account no longer exists."));
    }

    private AuthResponse issueTokens(User user) {
        String access = tokens.createAccessToken(user.getId(), user.getUsername());
        String refresh = tokens.issueRefreshToken(user.getId());
        return AuthResponse.bearer(UserResponse.from(user), access, refresh, tokens.accessTtlSeconds());
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}

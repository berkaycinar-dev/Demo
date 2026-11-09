package com.demo.backend.auth;

import com.demo.backend.user.UserResponse;

/** Matches AuthResponse in openapi.yaml. */
public record AuthResponse(
        UserResponse user,
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresIn) {

    public static AuthResponse bearer(UserResponse user, String accessToken, String refreshToken, long expiresIn) {
        return new AuthResponse(user, accessToken, refreshToken, "Bearer", expiresIn);
    }
}

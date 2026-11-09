package com.demo.backend.user;

import java.time.Instant;
import java.util.UUID;

/** Public view of a user. Never contains the password hash. Matches UserResponse in openapi.yaml. */
public record UserResponse(UUID id, String email, String username, Instant createdAt) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getUsername(), user.getCreatedAt());
    }
}

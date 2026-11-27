package com.samedesk.backend.user;

import com.fasterxml.jackson.annotation.JsonRawValue;
import java.time.Instant;
import java.util.UUID;

/**
 * Public view of a user. Never contains the password hash. Matches UserResponse in openapi.yaml.
 * avatar is the stored JSON object as is (AvatarRules wrote it), or null if never saved.
 */
public record UserResponse(UUID id, String email, String username, Instant createdAt, @JsonRawValue String avatar) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getUsername(), user.getCreatedAt(), user.getAvatar());
    }
}

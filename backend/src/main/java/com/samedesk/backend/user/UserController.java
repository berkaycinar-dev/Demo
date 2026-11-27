package com.samedesk.backend.user;

import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Profile endpoints. Contract: contracts/openapi.yaml, tag "users". No business logic here. */
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PutMapping("/me/avatar")
    public UserResponse changeAvatar(@AuthenticationPrincipal Jwt jwt, @RequestBody Map<String, Object> avatar) {
        return userService.changeAvatar(UUID.fromString(jwt.getSubject()), avatar);
    }
}

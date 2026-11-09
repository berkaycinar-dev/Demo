package com.demo.backend.room;

import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Room session endpoints. Contract: contracts/openapi.yaml, tag "rooms". No business logic here. */
@RestController
@RequestMapping("/api/v1/rooms/{roomId}/sessions")
public class RoomSessionController {

    private final RoomSessionService sessionService;

    public RoomSessionController(RoomSessionService sessionService) {
        this.sessionService = sessionService;
    }

    @PostMapping
    public RoomSessionResponse enter(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID roomId) {
        return sessionService.enter(userId(jwt), roomId);
    }

    @PostMapping("/current/heartbeat")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void heartbeat(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID roomId) {
        sessionService.heartbeat(userId(jwt), roomId);
    }

    @DeleteMapping("/current")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void exit(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID roomId) {
        sessionService.exit(userId(jwt), roomId);
    }

    @GetMapping("/active")
    public List<ActiveMemberResponse> active(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID roomId) {
        return sessionService.active(userId(jwt), roomId);
    }

    private static UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}

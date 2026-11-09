package com.demo.backend.room;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Room endpoints. Contract: contracts/openapi.yaml, tag "rooms". No business logic here. */
@RestController
@RequestMapping("/api/v1/rooms")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @GetMapping
    public List<RoomResponse> list(@AuthenticationPrincipal Jwt jwt,
                                   @RequestParam(defaultValue = "PUBLIC") RoomScope scope) {
        return roomService.list(userId(jwt), scope);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RoomResponse create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CreateRoomRequest request) {
        return roomService.create(userId(jwt), request);
    }

    @GetMapping("/{roomId}")
    public RoomResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID roomId) {
        return roomService.get(userId(jwt), roomId);
    }

    @PostMapping("/{roomId}/join")
    public RoomResponse join(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID roomId,
                             @RequestBody(required = false) JoinRoomRequest request) {
        String code = request != null ? request.inviteCode() : null;
        return roomService.join(userId(jwt), roomId, code);
    }

    private static UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}

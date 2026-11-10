package com.demo.backend.timer;

import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Timer endpoints. Contract: contracts/openapi.yaml, tag "timer". No business logic here. */
@RestController
@RequestMapping("/api/v1/timer")
public class TimerController {

    private final TimerService timerService;

    public TimerController(TimerService timerService) {
        this.timerService = timerService;
    }

    @GetMapping
    public TimerStateResponse get(@AuthenticationPrincipal Jwt jwt) {
        return timerService.get(userId(jwt));
    }

    @PostMapping("/commands")
    public TimerStateResponse command(@AuthenticationPrincipal Jwt jwt,
                                      @Valid @RequestBody TimerCommandRequest request) {
        return timerService.execute(userId(jwt), request);
    }

    private static UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}

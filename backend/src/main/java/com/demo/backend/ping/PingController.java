package com.demo.backend.ping;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller layer: receives the HTTP request, delegates to the service,
 * returns a DTO. No business logic here.
 */
@RestController
@RequestMapping("/api/v1")
public class PingController {

    private final PingService pingService;

    public PingController(PingService pingService) {
        this.pingService = pingService;
    }

    @GetMapping("/ping")
    public PingResponse ping() {
        return pingService.ping();
    }
}

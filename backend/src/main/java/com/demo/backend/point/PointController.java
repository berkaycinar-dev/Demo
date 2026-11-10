package com.demo.backend.point;

import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Points endpoints. Contract: contracts/openapi.yaml, tag "points". No business logic here. */
@RestController
@RequestMapping("/api/v1/points")
public class PointController {

    private final PointService pointService;

    public PointController(PointService pointService) {
        this.pointService = pointService;
    }

    @GetMapping("/me")
    public PointSummaryResponse summary(@AuthenticationPrincipal Jwt jwt) {
        return pointService.summary(userId(jwt));
    }

    @GetMapping("/me/events")
    public PointEventPage events(@AuthenticationPrincipal Jwt jwt,
                                 @RequestParam(defaultValue = "0") int page,
                                 @RequestParam(defaultValue = "" + PointService.DEFAULT_PAGE_SIZE) int size) {
        return pointService.history(userId(jwt), page, size);
    }

    private static UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}

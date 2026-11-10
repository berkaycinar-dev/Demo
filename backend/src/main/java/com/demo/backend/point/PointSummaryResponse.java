package com.demo.backend.point;

import java.time.Instant;

/** JSON of GET /api/v1/points/me. Field names are fixed by contracts/openapi.yaml. */
public record PointSummaryResponse(
        long totalPoints,
        long todayPoints,
        long completedBlocks,
        long focusSeconds,
        Instant serverTime) {
}

package com.odakhane.backend.ping;

import java.time.Instant;

/**
 * DTO: the JSON shape of GET /api/v1/ping, exactly as in contracts/openapi.yaml.
 * DTOs are what the API exposes; entities (database rows) never leave the service layer.
 */
public record PingResponse(String message, Instant serverTime) {
}

package com.demo.backend.common.error;

/**
 * Thrown by services when a requested resource does not exist
 * (e.g. RoomService.get(id) with an unknown id). Mapped to HTTP 404.
 *
 * The code is a stable, machine-readable string the frontend can switch on,
 * e.g. "ROOM_NOT_FOUND". The one-argument constructor uses the generic "NOT_FOUND".
 */
public class NotFoundException extends RuntimeException {

    private final String code;

    public NotFoundException(String message) {
        this("NOT_FOUND", message);
    }

    public NotFoundException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}

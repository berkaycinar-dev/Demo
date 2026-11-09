package com.demo.backend.common.error;

/**
 * Thrown by services when a requested resource does not exist
 * (e.g. RoomService.get(id) with an unknown id). Mapped to HTTP 404.
 */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}

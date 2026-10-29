package com.odakhane.backend.common.error;

/**
 * Thrown when a request is well-formed but breaks a business rule
 * (e.g. "room is full", "timer already running"). Mapped to HTTP 409.
 *
 * The code is a stable, machine-readable string the frontend can switch on,
 * e.g. "ROOM_FULL". The message is for humans.
 */
public class BusinessRuleException extends RuntimeException {

    private final String code;

    public BusinessRuleException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}

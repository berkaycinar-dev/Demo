package com.demo.backend.common.error;

/**
 * Thrown when the caller could not be identified or the credentials are wrong
 * (e.g. "INVALID_CREDENTIALS", "REFRESH_TOKEN_INVALID"). Mapped to HTTP 401.
 *
 * The code is a stable, machine-readable string the frontend can switch on.
 */
public class UnauthorizedException extends RuntimeException {

    private final String code;

    public UnauthorizedException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}

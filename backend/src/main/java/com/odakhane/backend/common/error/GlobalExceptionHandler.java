package com.odakhane.backend.common.error;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Turns exceptions into one consistent error body for the whole API
 * (RFC 9457 "problem details", see ErrorResponse in contracts/openapi.yaml):
 *
 * { "status": 409, "title": "Business rule violated", "detail": "...", "code": "ROOM_FULL" }
 *
 * Controllers and services just throw; nobody builds error JSON by hand.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    public ProblemDetail handleNotFound(NotFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("Not found");
        problem.setProperty("code", "NOT_FOUND");
        return problem;
    }

    @ExceptionHandler(BusinessRuleException.class)
    public ProblemDetail handleBusinessRule(BusinessRuleException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setTitle("Business rule violated");
        problem.setProperty("code", ex.getCode());
        return problem;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(err -> fieldErrors.putIfAbsent(err.getField(), err.getDefaultMessage()));

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Request validation failed");
        problem.setTitle("Validation error");
        problem.setProperty("code", "VALIDATION_ERROR");
        problem.setProperty("fieldErrors", fieldErrors);
        return problem;
    }
}

package com.office.brewdesk.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class LeaveException extends RuntimeException {
    public LeaveException(String message) {
        super(message);
    }
}

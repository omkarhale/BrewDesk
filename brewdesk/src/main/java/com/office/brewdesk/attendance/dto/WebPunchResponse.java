package com.office.brewdesk.attendance.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class WebPunchResponse {

    private Long eventId;
    private String employeeCode;
    private LocalDateTime eventTime;
    private String source;
    private String eventType;
    private String message;
}

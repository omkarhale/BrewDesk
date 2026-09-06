package com.office.brewdesk.attendance.dto;

import com.office.brewdesk.attendance.enums.AttendanceEventType;
import com.office.brewdesk.attendance.enums.AttendanceSource;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AttendanceEventResponse {

    private Long id;

    private Long employeeId;

    private String employeeCode;

    private AttendanceEventType eventType;

    private AttendanceSource source;

    private LocalDateTime eventTime;

    private String externalEventId;

    private LocalDateTime createdAt;
}
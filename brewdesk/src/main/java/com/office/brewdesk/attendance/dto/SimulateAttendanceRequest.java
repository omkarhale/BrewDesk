package com.office.brewdesk.attendance.dto;

import com.office.brewdesk.attendance.enums.AttendanceEventType;
import com.office.brewdesk.attendance.enums.AttendanceSource;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class SimulateAttendanceRequest {

    @NotBlank(message = "Employee code is required")
    private String employeeCode;

    @NotNull(message = "Event time is required")
    private LocalDateTime eventTime;

    @NotNull(message = "Event source is required")
    private AttendanceSource source;

    private AttendanceEventType eventType = AttendanceEventType.PUNCH;

    private String externalEventId;
}
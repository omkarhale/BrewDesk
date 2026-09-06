package com.office.brewdesk.attendance.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AttendanceSessionResponse {

    private Long id;

    private LocalDateTime punchIn;

    private LocalDateTime punchOut;

    private Integer workedMinutes;
}
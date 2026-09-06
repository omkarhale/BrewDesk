package com.office.brewdesk.attendance.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Builder
public class ShiftResponse {

    private Long id;

    private String name;

    private LocalTime startTime;
    private LocalTime endTime;

    private Integer breakMinutes;
    private Integer graceMinutes;
    private Integer minimumWorkMinutes;
    private Integer halfDayMinutes;

    private Boolean active;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
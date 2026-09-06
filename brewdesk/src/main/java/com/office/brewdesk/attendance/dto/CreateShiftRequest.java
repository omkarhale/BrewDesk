package com.office.brewdesk.attendance.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalTime;

@Getter
@Setter
public class CreateShiftRequest {

    @NotBlank(message = "Shift name is required")
    @Size(max = 100, message = "Shift name must not exceed 100 characters")
    private String name;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    @NotNull
    @Min(value = 0, message = "Break minutes cannot be negative")
    private Integer breakMinutes = 0;

    @NotNull
    @Min(value = 0, message = "Grace minutes cannot be negative")
    private Integer graceMinutes = 0;

    @NotNull
    @Min(value = 0, message = "Minimum work minutes cannot be negative")
    private Integer minimumWorkMinutes = 0;

    @NotNull
    @Min(value = 0, message = "Half-day minutes cannot be negative")
    private Integer halfDayMinutes = 0;
}
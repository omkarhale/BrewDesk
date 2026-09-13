package com.office.brewdesk.leave.dto;

import com.office.brewdesk.leave.enums.DayDuration;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter @Setter
public class ApplyLeaveRequest {

    @NotNull(message = "Leave type ID is required")
    private Long leaveTypeId;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    /** For half-day requests: FULL_DAY, FIRST_HALF, SECOND_HALF */
    private DayDuration dayDuration;

    @Size(max = 1000, message = "Reason must be at most 1000 characters")
    private String reason;
}

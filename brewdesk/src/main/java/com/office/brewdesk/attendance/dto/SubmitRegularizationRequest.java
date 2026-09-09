package com.office.brewdesk.attendance.dto;

import com.office.brewdesk.attendance.enums.HalfDayType;
import com.office.brewdesk.attendance.enums.RegularizationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Request body for POST /api/attendance/regularization.
 *
 * Submitted by an employee to request correction of their attendance
 * for a specific date.
 *
 * Field presence rules (enforced authoritatively in the service layer):
 *
 *   MISSED_PUNCH    — requestedPunchIn OR requestedPunchOut (whichever is missing)
 *   INCORRECT_PUNCH — requestedPunchIn AND requestedPunchOut
 *   LATE_ARRIVAL    — requestedPunchIn
 *   EARLY_EXIT      — requestedPunchOut
 *   HALF_DAY        — halfDayType required; times derived from shift
 *   FULL_DAY        — requestedPunchIn AND requestedPunchOut
 *
 * halfDayType must be null for all types other than HALF_DAY.
 * reason is mandatory for all types.
 */
@Getter
@Setter
public class SubmitRegularizationRequest {

    /**
     * The calendar date for which the correction is requested.
     * Must not be in the future (enforced in service).
     */
    @NotNull(message = "Attendance date is required")
    private LocalDate attendanceDate;

    /**
     * The category of correction being requested.
     */
    @NotNull(message = "Regularization type is required")
    private RegularizationType type;

    /**
     * Requested corrected punch-in time.
     * Nullable — only required for types that involve an IN correction.
     * Must be on the same date as attendanceDate or the following calendar
     * day for overnight shifts (validated in service).
     */
    private LocalDateTime requestedPunchIn;

    /**
     * Requested corrected punch-out time.
     * Nullable — only required for types that involve an OUT correction.
     * Must be after requestedPunchIn when both are supplied (validated in service).
     */
    private LocalDateTime requestedPunchOut;

    /**
     * Required when type is HALF_DAY; must be null for all other types.
     */
    private HalfDayType halfDayType;

    /**
     * Mandatory human-readable explanation from the employee.
     * Minimum 5 characters so that trivial/blank reasons are rejected.
     */
    @NotBlank(message = "Reason is required")
    @Size(min = 5, message = "Reason must be at least 5 characters")
    @Size(max = 1000, message = "Reason must not exceed 1000 characters")
    private String reason;
}

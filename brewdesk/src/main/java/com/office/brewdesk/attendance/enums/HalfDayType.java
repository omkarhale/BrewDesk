package com.office.brewdesk.attendance.enums;

/**
 * Specifies which half of the shift the employee was present for.
 *
 * FIRST_HALF  — Employee was present during the first portion of the shift.
 * SECOND_HALF — Employee was present during the second portion of the shift.
 *
 * The exact time boundary is derived from the employee's assigned Shift
 * configuration at approval time, not hard-coded here.
 *
 * Only relevant when RegularizationType is HALF_DAY.
 */
public enum HalfDayType {
    FIRST_HALF,
    SECOND_HALF
}

package com.office.brewdesk.attendance.enums;

/**
 * Describes the nature of the attendance correction being requested.
 *
 * MISSED_PUNCH    — Employee punched in but forgot to punch out (or vice versa).
 * INCORRECT_PUNCH — Both IN and OUT times were recorded but are wrong.
 * LATE_ARRIVAL    — Employee arrived late; requests correction of IN time.
 * EARLY_EXIT      — Employee left early; requests correction of OUT time.
 * HALF_DAY        — Employee worked only half the shift (see HalfDayType).
 * FULL_DAY        — Employee was absent but was actually present; full-day correction.
 */
public enum RegularizationType {

    MISSED_PUNCH,
    INCORRECT_PUNCH,
    LATE_ARRIVAL,
    EARLY_EXIT,
    HALF_DAY,
    FULL_DAY
}

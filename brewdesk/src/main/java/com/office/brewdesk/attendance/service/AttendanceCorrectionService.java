package com.office.brewdesk.attendance.service;

import com.office.brewdesk.attendance.entity.*;
import com.office.brewdesk.attendance.enums.AttendanceEventType;
import com.office.brewdesk.attendance.enums.AttendanceSource;
import com.office.brewdesk.attendance.enums.HalfDayType;
import com.office.brewdesk.attendance.enums.RegularizationType;
import com.office.brewdesk.attendance.repository.AttendanceEventRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

/**
 * Phase 7: Applies an approved regularization request to the attendance data.
 *
 * Strategy:
 *   1. Insert corrected AttendanceEvent rows (ADMIN source) based on the
 *      requested punch times derived from the request type.
 *   2. Call AttendanceCalculationService.calculateAttendance() to recompute
 *      the AttendanceRecord — the existing calculation logic handles all
 *      shift rules, late/early-exit, overnight shifts, etc. untouched.
 *
 * This service NEVER modifies AttendanceRecord directly.
 * It only injects AttendanceEvent rows and lets the existing engine
 * recalculate from the corrected event data.
 *
 * Existing events are NOT deleted. The correction events are additive;
 * calculateAttendance windows events around the shift, so earlier
 * incorrect punches that fall outside the ±4h window are ignored.
 * For correction types that fully replace the session (FULL_DAY,
 * INCORRECT_PUNCH), the service marks corrected events with a specific
 * externalEventId prefix so future duplicate-checks ignore them.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class AttendanceCorrectionService {

    private static final Logger log =
            LoggerFactory.getLogger(AttendanceCorrectionService.class);

    private final AttendanceEventRepository      eventRepository;
    private final AttendanceCalculationService   calculationService;

    /** Entry point called by RegularizationService after an APPROVED save. */
    public void applyCorrection(RegularizationRequest request) {

        EmployeeProfile employee      = request.getEmployee();
        LocalDate       date          = request.getAttendanceDate();
        RegularizationType type       = request.getType();
        Shift           shift         = employee.getShift();

        // Derive the punch-in / punch-out to inject
        LocalDateTime punchIn  = request.getRequestedPunchIn();
        LocalDateTime punchOut = request.getRequestedPunchOut();

        // For HALF_DAY derive times from the shift configuration
        if (type == RegularizationType.HALF_DAY && shift != null) {
            LocalDateTime[] halfDayTimes =
                    deriveHalfDayTimes(date, shift, request.getHalfDayType());
            if (punchIn  == null) punchIn  = halfDayTimes[0];
            if (punchOut == null) punchOut = halfDayTimes[1];
        }

        // Insert corrected events
        String prefix = "REG-" + request.getId() + "-";

        if (punchIn != null) {
            saveEvent(employee, punchIn,
                    prefix + "IN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        if (punchOut != null) {
            saveEvent(employee, punchOut,
                    prefix + "OUT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }

        // Recalculate — uses the existing engine with no modifications.
        // If recalculation fails, re-throw so the transaction rolls back
        // both the correction events AND the APPROVED status change — we
        // never want a request marked APPROVED with attendance unchanged.
        if (employee.getEmployeeCode() != null) {
            try {
                calculationService.calculateAttendance(employee.getEmployeeCode(), date);
            } catch (RuntimeException ex) {
                log.error("Regularization correction recalculation failed for "
                                + "employeeCode={}, date={}, requestId={}. "
                                + "Rolling back approval transaction.",
                        employee.getEmployeeCode(), date, request.getId(), ex);
                throw ex;
            }
        } else {
            log.warn("Approved regularization request id={} has no employeeCode; "
                    + "skipping recalculation.", request.getId());
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void saveEvent(EmployeeProfile employee, LocalDateTime time, String externalId) {
        AttendanceEvent event = AttendanceEvent.builder()
                .employee(employee)
                .eventType(AttendanceEventType.PUNCH)
                .eventTime(time)
                .attendanceSource(AttendanceSource.ADMIN)
                .externalEventId(externalId)
                .rawPayload("REGULARIZATION_CORRECTION")
                .build();
        eventRepository.save(event);
    }

    /**
     * Derives punch-in and punch-out times for a half-day request.
     *
     * FIRST_HALF:  IN  = shift start time;  OUT = shift start + (minimumWorkMinutes / 2)
     * SECOND_HALF: IN  = shift start + (minimumWorkMinutes / 2);  OUT = shift end time
     *
     * This uses the employee's configured Shift.minimumWorkMinutes so no
     * hard-coded hours are used — fully shift-driven as per the spec.
     */
    private LocalDateTime[] deriveHalfDayTimes(
            LocalDate   date,
            Shift       shift,
            HalfDayType halfDayType) {

        LocalDateTime shiftStart = LocalDateTime.of(date, shift.getStartTime());
        LocalDate     endDate    = shift.getEndTime().isBefore(shift.getStartTime())
                                   ? date.plusDays(1) : date;
        LocalDateTime shiftEnd   = LocalDateTime.of(endDate, shift.getEndTime());

        int halfMinutes = (shift.getMinimumWorkMinutes() > 0)
                ? shift.getMinimumWorkMinutes() / 2
                : (int) java.time.Duration.between(shiftStart, shiftEnd).toMinutes() / 2;

        if (halfDayType == HalfDayType.FIRST_HALF) {
            return new LocalDateTime[]{
                shiftStart,
                shiftStart.plusMinutes(halfMinutes)
            };
        } else { // SECOND_HALF
            return new LocalDateTime[]{
                shiftStart.plusMinutes(halfMinutes),
                shiftEnd
            };
        }
    }
}

package com.office.brewdesk.attendance.dto;

import com.office.brewdesk.attendance.enums.RegularizationStatus;
import com.office.brewdesk.attendance.enums.RegularizationType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Lightweight projection of a regularization request used in list views.
 *
 * Used by:
 *   GET /api/attendance/regularization              (employee list — own requests)
 *   GET /api/attendance/regularization/pending      (manager queue)
 *   GET /api/attendance/regularization/all          (admin / HR monitor)
 *
 * Omits heavy fields (currentAttendance, full attachment list) that are
 * only needed on the detail screen.  The frontend fetches the full
 * {@link RegularizationRequestResponse} when the user opens a request.
 *
 * hasAttachments is a boolean flag so the list row can show an attachment
 * indicator without fetching the full attachment list.
 */
@Getter
@Builder
public class RegularizationRequestSummaryResponse {

    private Long id;

    // ── Employee ──────────────────────────────────────────────────────────────

    private Long   employeeId;
    private String employeeCode;
    /** From EmployeeProfile.user.name — never a DB column. */
    private String employeeName;

    // ── Request details ───────────────────────────────────────────────────────

    private LocalDate              attendanceDate;
    private RegularizationType     type;
    private LocalDateTime          requestedPunchIn;
    private LocalDateTime          requestedPunchOut;

    // ── Current attendance (concise) ──────────────────────────────────────────

    /**
     * Status of the existing attendance record for this date.
     * Null if no record exists yet.
     * Shown as the "current" state in the manager list row.
     */
    private String currentAttendanceStatus;

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    private RegularizationStatus status;

    // ── Review ────────────────────────────────────────────────────────────────

    /** Name of the reviewer — null while PENDING. */
    private String reviewedByName;
    private LocalDateTime reviewedAt;

    // ── Attachment indicator ──────────────────────────────────────────────────

    /** True if the request has at least one supporting document attached. */
    private boolean hasAttachments;

    // ── Audit ─────────────────────────────────────────────────────────────────

    private LocalDateTime submittedAt;
}

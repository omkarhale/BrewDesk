package com.office.brewdesk.attendance.dto;

import com.office.brewdesk.attendance.enums.HalfDayType;
import com.office.brewdesk.attendance.enums.RegularizationStatus;
import com.office.brewdesk.attendance.enums.RegularizationType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Full detail response for a single regularization request.
 *
 * Returned by:
 *   GET  /api/attendance/regularization/{id}          (employee, manager, admin)
 *   POST /api/attendance/regularization               (on successful submission)
 *   POST /api/attendance/regularization/{id}/approve  (after approval)
 *   POST /api/attendance/regularization/{id}/reject   (after rejection)
 *
 * Employee name and manager name are projected from the existing
 * EmployeeProfile → User and EmployeeProfile.manager (User) relationships.
 * They are never stored as database columns.
 *
 * currentAttendance is a snapshot of the existing AttendanceRecord at the
 * time this response is built — used by the frontend to show the
 * "current vs requested" comparison panel.
 */
@Getter
@Builder
public class RegularizationRequestResponse {

    private Long id;

    // ── Employee ──────────────────────────────────────────────────────────────

    private Long employeeId;
    private String employeeCode;
    /** From EmployeeProfile.user.name — never a DB column. */
    private String employeeName;

    // ── Assigned manager ──────────────────────────────────────────────────────

    /** User.id of the employee's assigned manager — from EmployeeProfile.manager. */
    private Long managerId;
    /** From EmployeeProfile.manager.name — never a DB column. */
    private String managerName;

    // ── What is being corrected ───────────────────────────────────────────────

    private LocalDate       attendanceDate;
    private RegularizationType type;
    private LocalDateTime   requestedPunchIn;
    private LocalDateTime   requestedPunchOut;
    private HalfDayType     halfDayType;
    private String          reason;

    // ── Current attendance snapshot ───────────────────────────────────────────

    /**
     * The existing calculated attendance for this date at the time the
     * response is built. Null if no attendance record exists yet.
     * Used to render the "current vs requested" comparison panel.
     */
    private AttendanceRecordResponse currentAttendance;

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    private RegularizationStatus status;

    // ── Review ────────────────────────────────────────────────────────────────

    /** Null until the request is approved or rejected. */
    private Long   reviewedById;
    /** From reviewedBy.name — never a DB column. */
    private String reviewedByName;
    private String rejectionReason;
    private LocalDateTime reviewedAt;

    // ── Attachments ───────────────────────────────────────────────────────────

    private List<RegularizationAttachmentResponse> attachments;

    // ── Audit timestamps ──────────────────────────────────────────────────────

    private LocalDateTime submittedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

package com.office.brewdesk.attendance.entity;

import com.office.brewdesk.attendance.enums.HalfDayType;
import com.office.brewdesk.attendance.enums.RegularizationStatus;
import com.office.brewdesk.attendance.enums.RegularizationType;
import com.office.brewdesk.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents an employee's request to correct their attendance record
 * for a specific date.
 *
 * Lifecycle:
 *   PENDING → APPROVED  (by manager or admin)
 *   PENDING → REJECTED  (by manager or admin)
 *   PENDING → CANCELLED (by the employee who submitted it)
 *
 * Relationships (all reuse existing entities — no duplication):
 *   employee       → EmployeeProfile  (who is requesting the correction)
 *   attendanceDate → the date being corrected
 *   attendanceRecord → AttendanceRecord for that date (nullable — may not
 *                      exist yet if the employee has no calculated record)
 *   reviewedBy     → User who approved or rejected (nullable until actioned)
 *
 * Manager relationship:
 *   The approving manager is resolved at review time from
 *   employee.manager (EmployeeProfile.manager → User).
 *   We do NOT store a separate "assignedManager" FK here to avoid
 *   duplicating the relationship that already exists on EmployeeProfile.
 *
 * Half-day:
 *   halfDayType is only meaningful when type == HALF_DAY.
 *   The time boundary for FIRST_HALF / SECOND_HALF is derived from
 *   the employee's Shift at service layer — not stored here.
 *
 * Audit:
 *   submittedAt  — when the employee created this request
 *   reviewedAt   — when the manager/admin acted on it (nullable)
 *   createdAt    — JPA lifecycle, set once on insert
 *   updatedAt    — JPA lifecycle, updated on every save
 */
@Entity
@Table(
        name = "regularization_requests",
        indexes = {
                @Index(name = "idx_reg_employee_date",
                       columnList = "employee_id, attendance_date"),
                @Index(name = "idx_reg_status",
                       columnList = "status"),
                @Index(name = "idx_reg_reviewed_by",
                       columnList = "reviewed_by")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegularizationRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Who is requesting ────────────────────────────────────────────────────

    /**
     * The employee whose attendance is being corrected.
     * Used to resolve the approving manager via employee.manager.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private EmployeeProfile employee;

    // ── What date / record ───────────────────────────────────────────────────

    /**
     * The calendar date the employee is requesting to correct.
     */
    @Column(name = "attendance_date", nullable = false)
    private LocalDate attendanceDate;

    /**
     * The existing calculated attendance record for that date.
     * Nullable: a record may not yet exist (e.g. ABSENT with no calculation run).
     * This FK is resolved at request-creation time and stored for audit.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attendance_record_id")
    private AttendanceRecord attendanceRecord;

    // ── What correction is requested ─────────────────────────────────────────

    /**
     * The category of correction being requested.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RegularizationType type;

    /**
     * Requested punch-in time.
     * Required for: MISSED_PUNCH (out missing), INCORRECT_PUNCH, LATE_ARRIVAL,
     *               HALF_DAY (SECOND_HALF), FULL_DAY.
     * Nullable when only the OUT time is being corrected.
     */
    @Column(name = "requested_punch_in")
    private LocalDateTime requestedPunchIn;

    /**
     * Requested punch-out time.
     * Required for: MISSED_PUNCH (in missing), INCORRECT_PUNCH, EARLY_EXIT,
     *               HALF_DAY (FIRST_HALF), FULL_DAY.
     * Nullable when only the IN time is being corrected.
     */
    @Column(name = "requested_punch_out")
    private LocalDateTime requestedPunchOut;

    /**
     * Only meaningful when type == HALF_DAY.
     * Null for all other request types.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "half_day_type", length = 20)
    private HalfDayType halfDayType;

    // ── Why ──────────────────────────────────────────────────────────────────

    /**
     * Mandatory human-readable reason supplied by the employee.
     * Minimum 5 characters enforced at the service / DTO validation layer.
     */
    @Column(nullable = false, length = 1000)
    private String reason;

    // ── Lifecycle status ─────────────────────────────────────────────────────

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private RegularizationStatus status = RegularizationStatus.PENDING;

    // ── Review ───────────────────────────────────────────────────────────────

    /**
     * The User (manager or admin) who approved or rejected this request.
     * Null while status is PENDING or CANCELLED.
     * Typed as User — matches EmployeeProfile.manager which is also typed as User.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    /**
     * Free-text reason provided by the reviewer when rejecting.
     * Mandatory on REJECTED, null otherwise.
     */
    @Column(name = "rejection_reason", length = 1000)
    private String rejectionReason;

    /**
     * Timestamp when the manager/admin actioned the request.
     * Null while PENDING or CANCELLED.
     */
    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    // ── Attachments ──────────────────────────────────────────────────────────

    /**
     * Supporting documents uploaded by the employee.
     * Cascade ALL so attachments are deleted with the request.
     * orphanRemoval = true so removing from list also deletes the row.
     */
    @OneToMany(
            mappedBy = "regularizationRequest",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @Builder.Default
    private List<RegularizationAttachment> attachments = new ArrayList<>();

    // ── Audit timestamps ─────────────────────────────────────────────────────

    /**
     * When the employee submitted this request.
     * Set once on insert; never updated.
     */
    @Column(name = "submitted_at", nullable = false, updatable = false)
    private LocalDateTime submittedAt;

    /** JPA-managed creation timestamp. Set once on insert. */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** JPA-managed update timestamp. Updated on every save. */
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // ── JPA lifecycle ─────────────────────────────────────────────────────────

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        submittedAt = now;
        createdAt   = now;
        updatedAt   = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

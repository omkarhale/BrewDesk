package com.office.brewdesk.attendance.enums;

/**
 * Lifecycle states for a regularization request.
 *
 * Valid transitions:
 *   PENDING  → APPROVED
 *   PENDING  → REJECTED
 *   PENDING  → CANCELLED
 *
 * Terminal states (no further transitions allowed):
 *   APPROVED, REJECTED, CANCELLED
 */
public enum RegularizationStatus {

    /** Request submitted by employee, awaiting manager/admin review. */
    PENDING,

    /** Request approved by manager or admin. Attendance has been corrected. */
    APPROVED,

    /** Request rejected by manager or admin. Attendance unchanged. */
    REJECTED,

    /** Request cancelled by the submitting employee before approval. */
    CANCELLED
}

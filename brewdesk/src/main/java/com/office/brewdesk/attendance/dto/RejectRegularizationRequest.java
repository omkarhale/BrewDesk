package com.office.brewdesk.attendance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/**
 * Request body for POST /api/attendance/regularization/{id}/reject.
 *
 * Submitted by a manager or admin when rejecting a regularization request.
 * The rejection reason is mandatory so that the employee understands why
 * their request was declined and the audit trail is complete.
 */
@Getter
@Setter
public class RejectRegularizationRequest {

    /**
     * Mandatory explanation from the reviewer explaining why the request
     * is being rejected.
     *
     * Minimum 5 characters to prevent empty or meaningless rejections.
     * Stored in RegularizationRequest.rejectionReason.
     */
    @NotBlank(message = "Rejection reason is required")
    @Size(min = 5,   message = "Rejection reason must be at least 5 characters")
    @Size(max = 1000, message = "Rejection reason must not exceed 1000 characters")
    private String rejectionReason;
}

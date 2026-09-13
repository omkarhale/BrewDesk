package com.office.brewdesk.leave.dto;

import com.office.brewdesk.leave.enums.AccrualStartRule;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter @Setter
public class CreateLeavePolicyRequest {

    @NotNull(message = "Leave type ID is required")
    private Long leaveTypeId;

    @NotBlank(message = "Policy name is required")
    @Size(max = 150)
    private String policyName;

    @NotNull
    private AccrualStartRule accrualStartRule;

    @NotNull @Min(0)
    private Integer minimumNoticeDays;

    @NotNull @Min(1)
    private Integer maximumConsecutiveDays;

    @NotNull private Boolean backdatedAllowed;
    @NotNull private Boolean cancellationAllowed;
    @NotNull private Boolean approvalRequired;

    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;

    /** Optional: department IDs to assign on creation. */
    private List<Long> departmentIds;
}

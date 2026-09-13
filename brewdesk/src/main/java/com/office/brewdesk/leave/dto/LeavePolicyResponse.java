package com.office.brewdesk.leave.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter @Builder
public class LeavePolicyResponse {
    private Long id;
    private Long leaveTypeId;
    private String leaveTypeName;
    private String leaveTypeCode;
    private String policyName;
    private String accrualStartRule;
    private int minimumNoticeDays;
    private int maximumConsecutiveDays;
    private boolean backdatedAllowed;
    private boolean cancellationAllowed;
    private boolean approvalRequired;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    private boolean active;
    private List<DepartmentAssignmentResponse> departments;
}

package com.office.brewdesk.leave.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Builder
public class LeaveRequestResponse {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private String employeeCode;
    private Long leaveTypeId;
    private String leaveTypeName;
    private String leaveTypeCode;
    private LocalDate startDate;
    private LocalDate endDate;
    private double totalDays;
    private String status;
    private String dayDuration;
    private String reason;
    private String remarks;
    private String approvedBy;
    private LocalDateTime approvedAt;
    private String rejectedBy;
    private LocalDateTime rejectedAt;
    private LocalDateTime createdAt;
    private List<LeaveApprovalHistoryResponse> history;
}

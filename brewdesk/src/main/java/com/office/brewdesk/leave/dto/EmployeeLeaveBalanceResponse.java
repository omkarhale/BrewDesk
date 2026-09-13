package com.office.brewdesk.leave.dto;

import lombok.Builder;
import lombok.Getter;

@Getter @Builder
public class EmployeeLeaveBalanceResponse {
    private Long id;
    private Long leaveTypeId;
    private String leaveTypeCode;
    private String leaveTypeName;
    private boolean paid;
    private double openingBalance;
    private double accrued;
    private double used;
    private double pending;
    private double adjusted;
    private double available;
}

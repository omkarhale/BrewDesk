package com.office.brewdesk.leave.dto;

import lombok.Builder;
import lombok.Getter;

@Getter @Builder
public class LeaveTypeResponse {
    private Long id;
    private String code;
    private String name;
    private String description;
    private boolean paid;
    private String genderEligibility;
    private String accrualFrequency;
    private double accrualAmount;
    private double yearlyAllocation;
    private boolean halfDayAllowed;
    private boolean carryForwardEnabled;
    private double carryForwardLimit;
    private boolean documentRequired;
    private boolean active;
}

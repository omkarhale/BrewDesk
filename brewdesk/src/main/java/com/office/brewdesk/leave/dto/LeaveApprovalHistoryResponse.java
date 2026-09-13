package com.office.brewdesk.leave.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter @Builder
public class LeaveApprovalHistoryResponse {
    private Long id;
    private String action;
    private String performedBy;
    private String remarks;
    private LocalDateTime createdAt;
}

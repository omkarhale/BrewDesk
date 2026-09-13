package com.office.brewdesk.leave.dto;

import lombok.Builder;
import lombok.Getter;

@Getter @Builder
public class DepartmentAssignmentResponse {
    private Long id;
    private Long departmentId;
    private String departmentName;
    private String departmentCode;
}

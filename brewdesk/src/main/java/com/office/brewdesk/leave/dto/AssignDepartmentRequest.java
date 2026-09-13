package com.office.brewdesk.leave.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class AssignDepartmentRequest {
    @NotNull(message = "Department ID is required")
    private Long departmentId;
}

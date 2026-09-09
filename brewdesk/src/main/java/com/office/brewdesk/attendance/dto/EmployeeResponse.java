package com.office.brewdesk.attendance.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class EmployeeResponse {

    private Long id;
    private Long userId;
    private String userName;

    private String employeeCode;

    private Long departmentId;
    private String departmentName;

    private Long shiftId;
    private String shiftName;

    private String designation;

    private Long managerId;

    private LocalDate joiningDate;

    private Boolean active;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
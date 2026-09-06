package com.office.brewdesk.attendance.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class CreateEmployeeRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotBlank(message = "Employee code is required")
    @Size(max = 50, message = "Employee code must not exceed 50 characters")
    private String employeeCode;

    private Long departmentId;

    private Long shiftId;

    @Size(max = 100, message = "Designation must not exceed 100 characters")
    private String designation;

    private Long managerId;

    @NotNull(message = "Joining date is required")
    private LocalDate joiningDate;
}
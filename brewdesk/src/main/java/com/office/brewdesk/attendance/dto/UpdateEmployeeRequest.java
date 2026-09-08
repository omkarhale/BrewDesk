package com.office.brewdesk.attendance.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class UpdateEmployeeRequest {

    private Long departmentId;

    private Long shiftId;

    @Size(max = 100, message = "Designation must not exceed 100 characters")
    private String designation;

    private Long managerId;

    @NotNull(message = "Joining date is required")
    private LocalDate joiningDate;

    private Boolean active;
}

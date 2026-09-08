package com.office.brewdesk.attendance.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class BulkCalculationRequest {

    /** If null, calculates for ALL active employees */
    private String employeeCode;

    @NotNull(message = "From date is required")
    private LocalDate dateFrom;

    @NotNull(message = "To date is required")
    private LocalDate dateTo;
}

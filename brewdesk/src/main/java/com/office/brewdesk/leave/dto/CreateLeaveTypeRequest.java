package com.office.brewdesk.leave.dto;

import com.office.brewdesk.leave.enums.AccrualFrequency;
import com.office.brewdesk.leave.enums.GenderEligibility;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class CreateLeaveTypeRequest {

    @NotBlank(message = "Code is required")
    @Size(max = 20, message = "Code must be at most 20 characters")
    @Pattern(regexp = "^[A-Z0-9_]+$", message = "Code must be uppercase letters, digits or underscores")
    private String code;

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must be at most 100 characters")
    private String name;

    @Size(max = 500)
    private String description;

    @NotNull(message = "Paid flag is required")
    private Boolean paid;

    @NotNull(message = "Gender eligibility is required")
    private GenderEligibility genderEligibility;

    @NotNull(message = "Accrual frequency is required")
    private AccrualFrequency accrualFrequency;

    @NotNull @DecimalMin("0.0")
    private Double accrualAmount;

    @NotNull @DecimalMin("0.0")
    private Double yearlyAllocation;

    @NotNull private Boolean halfDayAllowed;
    @NotNull private Boolean carryForwardEnabled;

    @DecimalMin("0.0")
    private Double carryForwardLimit;

    @NotNull private Boolean documentRequired;
}

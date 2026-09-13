package com.office.brewdesk.dto;

import com.office.brewdesk.enums.Gender;
import com.office.brewdesk.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateUserRequest {

    @NotBlank
    private String name;

    @NotBlank
    @Email
    private String email;

    @NotNull
    private Role role;

    /** Gender is the source of truth for leave eligibility (e.g. Maternity Leave). */
    private Gender gender;
}
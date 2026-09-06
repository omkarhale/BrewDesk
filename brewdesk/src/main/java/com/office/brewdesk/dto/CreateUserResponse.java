package com.office.brewdesk.dto;

import com.office.brewdesk.enums.Role;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CreateUserResponse {

    private Long id;

    private String name;

    private String email;

    private Role role;

    private String temporaryPassword;
}
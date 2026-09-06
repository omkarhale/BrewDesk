package com.office.brewdesk.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LoginResponse {

    private String token;

    private String name;

    private String email;

    private String role;
    private boolean mustChangePassword;
}
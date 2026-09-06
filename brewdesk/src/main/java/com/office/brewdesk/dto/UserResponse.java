package com.office.brewdesk.dto;

import com.office.brewdesk.enums.Role;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class UserResponse {

    private Long id;
    private String name;
    private String email;
    private String role;
    private boolean active;
    private boolean mustChangePassword;
    private LocalDateTime createdAt;
}
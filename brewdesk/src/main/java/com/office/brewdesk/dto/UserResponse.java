package com.office.brewdesk.dto;

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
    private String gender;
    private boolean active;
    private boolean mustChangePassword;
    private LocalDateTime createdAt;
}
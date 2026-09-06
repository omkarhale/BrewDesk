package com.office.brewdesk.attendance.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class DepartmentResponse {

    private Long id;
    private String name;
    private String code;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
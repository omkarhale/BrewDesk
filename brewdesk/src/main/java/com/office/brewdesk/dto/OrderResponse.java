package com.office.brewdesk.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class OrderResponse {

    private Long orderId;

    private Long employeeId;

    private String employeeName;

    private Long beverageId;

    private String beverageName;

    private String beverageIcon;

    private Long roundId;

    private String roundName;

    private String roundStatus;

    private LocalDateTime createdAt;
}
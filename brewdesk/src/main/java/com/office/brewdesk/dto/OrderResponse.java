package com.office.brewdesk.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class OrderResponse {

    private Long orderId;

    private String employeeName;

    private String beverageName;

    private String roundName;

    private LocalDateTime createdAt;
}
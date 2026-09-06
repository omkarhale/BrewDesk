package com.office.brewdesk.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class RoundSummaryResponse {

    private Long roundId;

    private String roundName;

    private long totalOrders;

    private List<BeverageSummary> beverages;
}
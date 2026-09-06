package com.office.brewdesk.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BeverageSummary {

    private String beverageName;

    private String icon;

    private long count;
}
package com.office.brewdesk.attendance.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class BulkCalculationResponse {

    private int totalDays;
    private int totalEmployees;
    private int successCount;
    private int skippedCount;
    private int errorCount;
    private List<String> errors;
}

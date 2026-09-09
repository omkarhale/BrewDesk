package com.office.brewdesk.attendance.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * Paginated wrapper for regularization request list views.
 *
 * Follows the exact same structure as {@link AttendanceRecordsPageResponse}
 * and {@link AttendanceEventPageResponse}:
 * content, pageNumber, pageSize, totalElements, totalPages, first, last.
 */
@Getter
@Builder
public class RegularizationRequestPageResponse {

    private List<RegularizationRequestSummaryResponse> content;

    private int  pageNumber;
    private int  pageSize;
    private long totalElements;
    private int  totalPages;
    private boolean first;
    private boolean last;
}

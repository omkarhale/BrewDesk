package com.office.brewdesk.leave.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter @Builder
public class LeavePageResponse {
    private List<LeaveRequestResponse> content;
    private int pageNumber;
    private int pageSize;
    private long totalElements;
    private int totalPages;
    private boolean first;
    private boolean last;
}

package com.office.brewdesk.attendance.dto;

import com.office.brewdesk.attendance.enums.AttendanceStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class AttendanceRecordResponse {

    private Long id;

    private Long employeeId;
    private String employeeCode;
    private String employeeName;

    private Long shiftId;
    private String shiftName;

    private LocalDate attendanceDate;

    private LocalDateTime firstIn;
    private LocalDateTime lastOut;

    private Integer totalWorkMinutes;

    private Integer lateMinutes;
    private Integer earlyExitMinutes;

    private AttendanceStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<AttendanceSessionResponse> sessions;
}
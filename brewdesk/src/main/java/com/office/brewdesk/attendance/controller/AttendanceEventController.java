package com.office.brewdesk.attendance.controller;

import com.office.brewdesk.attendance.dto.AttendanceEventPageResponse;
import com.office.brewdesk.attendance.service.AttendanceEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/attendance/events")
@RequiredArgsConstructor
public class AttendanceEventController {

    private final AttendanceEventService attendanceEventService;

    /**
     * Paginated audit log of raw punch events.
     * Admins & managers can filter by employee code and date range.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','REPORTING_MANAGER')")
    public ResponseEntity<AttendanceEventPageResponse> getEvents(
            @RequestParam(required = false) String employeeCode,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(defaultValue = "0")   int page,
            @RequestParam(defaultValue = "50")  int size
    ) {
        return ResponseEntity.ok(
                attendanceEventService.getEvents(employeeCode, dateFrom, dateTo, page, size));
    }
}

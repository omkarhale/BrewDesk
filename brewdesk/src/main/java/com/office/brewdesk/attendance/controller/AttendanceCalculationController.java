package com.office.brewdesk.attendance.controller;

import com.office.brewdesk.attendance.dto.*;
import com.office.brewdesk.attendance.entity.AttendanceRecord;
import com.office.brewdesk.attendance.enums.AttendanceStatus;
import com.office.brewdesk.attendance.service.AttendanceCalculationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceCalculationController {

    private final AttendanceCalculationService attendanceCalculationService;

    // -- Single calculation ----------------------------------------------------

    @PostMapping("/calculation")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','REPORTING_MANAGER')")
    public ResponseEntity<AttendanceRecordResponse> calculateAttendance(
            @RequestParam String employeeCode,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate attendanceDate) {
        AttendanceRecord record =
                attendanceCalculationService.calculateAttendance(employeeCode, attendanceDate);
        return ResponseEntity.ok(attendanceCalculationService.mapToResponse(record));
    }

    // -- Bulk calculation ------------------------------------------------------

    @PostMapping("/calculation/bulk")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<BulkCalculationResponse> bulkCalculate(
            @Valid @RequestBody BulkCalculationRequest request) {
        return ResponseEntity.ok(attendanceCalculationService.bulkCalculate(request));
    }

    // -- Paginated records list ------------------------------------------------

    @GetMapping("/records")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','REPORTING_MANAGER')")
    public ResponseEntity<AttendanceRecordsPageResponse> getRecords(
            @RequestParam(required = false) String employeeCode,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) AttendanceStatus status,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(
                attendanceCalculationService.getRecords(
                        employeeCode, dateFrom, dateTo, status, page, size));
    }

    // -- Monthly records (calendar view) --------------------------------------

    @GetMapping("/records/month")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','REPORTING_MANAGER','CHEF','EMPLOYEE')")
    public ResponseEntity<List<AttendanceRecordResponse>> getMonthRecords(
            @RequestParam String employeeCode,
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(
                attendanceCalculationService.getMonthRecords(employeeCode, year, month));
    }
}

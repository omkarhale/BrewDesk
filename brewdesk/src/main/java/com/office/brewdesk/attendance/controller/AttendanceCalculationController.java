package com.office.brewdesk.attendance.controller;

import com.office.brewdesk.attendance.dto.AttendanceRecordResponse;
import com.office.brewdesk.attendance.dto.AttendanceRecordsPageResponse;
import com.office.brewdesk.attendance.entity.AttendanceRecord;
import com.office.brewdesk.attendance.enums.AttendanceStatus;
import com.office.brewdesk.attendance.service.AttendanceCalculationService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceCalculationController {

    private final AttendanceCalculationService attendanceCalculationService;

    // ── Calculate attendance for one employee/date ────────────────────────────

    @PostMapping("/calculation")
    public ResponseEntity<AttendanceRecordResponse> calculateAttendance(
            @RequestParam String employeeCode,
            @RequestParam LocalDate attendanceDate
    ) {
        AttendanceRecord record =
                attendanceCalculationService.calculateAttendance(
                        employeeCode,
                        attendanceDate
                );

        return ResponseEntity.ok(
                attendanceCalculationService.mapToResponse(record)
        );
    }

    // ── Paginated filtered records list ───────────────────────────────────────

    @GetMapping("/records")
    public ResponseEntity<AttendanceRecordsPageResponse> getRecords(
            @RequestParam(required = false) String employeeCode,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) AttendanceStatus status,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(
                attendanceCalculationService.getRecords(
                        employeeCode, dateFrom, dateTo, status, page, size
                )
        );
    }

    // ── Monthly calendar data (all days in a month for one employee) ──────────

    @GetMapping("/records/month")
    public ResponseEntity<List<AttendanceRecordResponse>> getMonthRecords(
            @RequestParam String employeeCode,
            @RequestParam int year,
            @RequestParam int month
    ) {
        return ResponseEntity.ok(
                attendanceCalculationService.getMonthRecords(employeeCode, year, month)
        );
    }
}

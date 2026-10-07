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

import com.office.brewdesk.attendance.entity.EmployeeProfile;
import com.office.brewdesk.attendance.repository.EmployeeProfileRepository;
import com.office.brewdesk.entity.User;
import com.office.brewdesk.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceCalculationController {

    private final AttendanceCalculationService attendanceCalculationService;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final UserRepository userRepository;

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
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<AttendanceRecordResponse>> getMonthRecords(
            @RequestParam String employeeCode,
            @RequestParam int year,
            @RequestParam int month,
            Authentication authentication) {
        validateEmployeeAccess(employeeCode, authentication);
        return ResponseEntity.ok(
                attendanceCalculationService.getMonthRecords(employeeCode, year, month));
    }

    @GetMapping("/records/my-month")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<AttendanceRecordResponse>> getMyMonthRecords(
            @RequestParam int year,
            @RequestParam int month,
            Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        EmployeeProfile profile = employeeProfileRepository.findByUser(user)
                .orElseThrow(() -> new IllegalArgumentException("Employee profile not found"));

        return ResponseEntity.ok(
                attendanceCalculationService.getMonthRecords(profile.getEmployeeCode(), year, month));
    }

    private void validateEmployeeAccess(String targetEmployeeCode, Authentication auth) {
        boolean isPrivileged = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN") || a.getAuthority().equals("ROLE_ADMIN"));
        if (isPrivileged) {
            return;
        }

        String email = auth.getName();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        EmployeeProfile targetEmployee = employeeProfileRepository.findByEmployeeCode(targetEmployeeCode)
                .orElseThrow(() -> new IllegalArgumentException("Target employee not found"));

        boolean isSelf = targetEmployee.getUser() != null && targetEmployee.getUser().getId().equals(currentUser.getId());
        if (isSelf) {
            return;
        }

        boolean isManager = targetEmployee.getManager() != null && targetEmployee.getManager().getId().equals(currentUser.getId());
        if (isManager && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_REPORTING_MANAGER"))) {
            return;
        }

        throw new AccessDeniedException("You are not authorized to view attendance records for this employee");
    }
}

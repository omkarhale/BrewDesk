package com.office.brewdesk.attendance.controller;

import com.office.brewdesk.attendance.dto.CreateEmployeeRequest;
import com.office.brewdesk.attendance.dto.EmployeeResponse;
import com.office.brewdesk.attendance.dto.UpdateEmployeeRequest;
import com.office.brewdesk.attendance.service.EmployeeProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/attendance/employees")
@RequiredArgsConstructor
public class EmployeeProfileController {

    private final EmployeeProfileService employeeProfileService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<EmployeeResponse> createEmployee(
            @Valid @RequestBody CreateEmployeeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(employeeProfileService.createEmployee(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<List<EmployeeResponse>> getAllEmployees() {
        return ResponseEntity.ok(employeeProfileService.getAllEmployees());
    }

    /**
     * Returns only the employees who report to the authenticated user.
     * Used by Reporting Managers to see their own team — they cannot
     * call /employees (all) because that is restricted to ADMIN/SUPER_ADMIN.
     */
    @GetMapping("/my-team")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','REPORTING_MANAGER')")
    public ResponseEntity<List<EmployeeResponse>> getMyTeam() {
        return ResponseEntity.ok(employeeProfileService.getMyTeam());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','REPORTING_MANAGER')")
    public ResponseEntity<EmployeeResponse> getEmployee(@PathVariable Long id) {
        return ResponseEntity.ok(employeeProfileService.getEmployee(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<EmployeeResponse> updateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody UpdateEmployeeRequest request) {
        return ResponseEntity.ok(employeeProfileService.updateEmployee(id, request));
    }

    @PutMapping("/{id}/shift")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<EmployeeResponse> updateEmployeeShift(
            @PathVariable Long id,
            @RequestParam Long shiftId) {
        return ResponseEntity.ok(employeeProfileService.updateEmployeeShift(id, shiftId));
    }
}

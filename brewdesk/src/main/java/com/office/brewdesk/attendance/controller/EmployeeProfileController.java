package com.office.brewdesk.attendance.controller;

import com.office.brewdesk.attendance.dto.CreateEmployeeRequest;
import com.office.brewdesk.attendance.dto.EmployeeResponse;
import com.office.brewdesk.attendance.service.EmployeeProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/attendance/employees")
@RequiredArgsConstructor
public class EmployeeProfileController {

    private final EmployeeProfileService employeeProfileService;

    @PostMapping
    public ResponseEntity<EmployeeResponse> createEmployee(
            @Valid @RequestBody CreateEmployeeRequest request
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(employeeProfileService.createEmployee(request));
    }

    @GetMapping
    public ResponseEntity<List<EmployeeResponse>> getAllEmployees() {

        return ResponseEntity.ok(
                employeeProfileService.getAllEmployees()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeResponse> getEmployee(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                employeeProfileService.getEmployee(id)
        );
    }
    @PutMapping("/{id}/shift")
    public ResponseEntity<EmployeeResponse> updateEmployeeShift(
            @PathVariable Long id,
            @RequestParam Long shiftId
    ) {

        return ResponseEntity.ok(
                employeeProfileService.updateEmployeeShift(
                        id,
                        shiftId
                )
        );
    }
}
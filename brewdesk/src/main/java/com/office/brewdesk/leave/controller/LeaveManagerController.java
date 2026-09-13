package com.office.brewdesk.leave.controller;

import com.office.brewdesk.leave.dto.*;
import com.office.brewdesk.leave.service.LeaveManagerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leave/manager")
@RequiredArgsConstructor
public class LeaveManagerController {

    private final LeaveManagerService managerService;

    private static final String MANAGER_ROLES =
            "hasAnyRole('SUPER_ADMIN','ADMIN','REPORTING_MANAGER')";

    @GetMapping("/requests/pending")
    @PreAuthorize(MANAGER_ROLES)
    public ResponseEntity<List<LeaveRequestResponse>> getPending() {
        return ResponseEntity.ok(managerService.getPendingRequests());
    }

    @GetMapping("/requests")
    @PreAuthorize(MANAGER_ROLES)
    public ResponseEntity<LeavePageResponse> getAllTeamRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(managerService.getAllTeamRequests(page, size));
    }

    @GetMapping("/requests/{id}")
    @PreAuthorize(MANAGER_ROLES)
    public ResponseEntity<LeaveRequestResponse> getDetail(@PathVariable Long id) {
        return ResponseEntity.ok(managerService.getRequestDetail(id));
    }

    @PutMapping("/requests/{id}/approve")
    @PreAuthorize(MANAGER_ROLES)
    public ResponseEntity<LeaveRequestResponse> approve(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) ReviewLeaveRequest review) {
        return ResponseEntity.ok(managerService.approve(id, review));
    }

    @PutMapping("/requests/{id}/reject")
    @PreAuthorize(MANAGER_ROLES)
    public ResponseEntity<LeaveRequestResponse> reject(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) ReviewLeaveRequest review) {
        return ResponseEntity.ok(managerService.reject(id, review));
    }
}

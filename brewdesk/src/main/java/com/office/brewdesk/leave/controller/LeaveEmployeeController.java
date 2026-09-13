package com.office.brewdesk.leave.controller;

import com.office.brewdesk.leave.dto.*;
import com.office.brewdesk.leave.service.LeaveRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/leave")
@RequiredArgsConstructor
public class LeaveEmployeeController {

    private final LeaveRequestService leaveRequestService;

    private static final String ALL_STAFF =
            "hasAnyRole('SUPER_ADMIN','ADMIN','REPORTING_MANAGER','CHEF','EMPLOYEE')";

    @GetMapping("/types")
    @PreAuthorize(ALL_STAFF)
    public ResponseEntity<List<LeaveTypeResponse>> getEligibleTypes() {
        return ResponseEntity.ok(leaveRequestService.getEligibleLeaveTypes());
    }

    @GetMapping("/balances/me")
    @PreAuthorize(ALL_STAFF)
    public ResponseEntity<List<EmployeeLeaveBalanceResponse>> getMyBalances() {
        return ResponseEntity.ok(leaveRequestService.getMyBalances());
    }

    @PostMapping("/requests")
    @PreAuthorize(ALL_STAFF)
    public ResponseEntity<LeaveRequestResponse> applyLeave(@Valid @RequestBody ApplyLeaveRequest req) {
        LeaveRequestResponse response = leaveRequestService.applyLeave(req);
        return ResponseEntity.created(URI.create("/api/leave/requests/me/" + response.getId()))
                .body(response);
    }

    @GetMapping("/requests/me")
    @PreAuthorize(ALL_STAFF)
    public ResponseEntity<LeavePageResponse> getMyRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(leaveRequestService.getMyRequests(page, size));
    }

    @GetMapping("/requests/me/{id}")
    @PreAuthorize(ALL_STAFF)
    public ResponseEntity<LeaveRequestResponse> getMyRequestById(@PathVariable Long id) {
        return ResponseEntity.ok(leaveRequestService.getMyRequestById(id));
    }

    @PutMapping("/requests/{id}/cancel")
    @PreAuthorize(ALL_STAFF)
    public ResponseEntity<LeaveRequestResponse> cancelLeave(@PathVariable Long id) {
        return ResponseEntity.ok(leaveRequestService.cancelLeave(id));
    }
}

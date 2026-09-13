package com.office.brewdesk.leave.controller;

import com.office.brewdesk.leave.dto.CreateLeaveTypeRequest;
import com.office.brewdesk.leave.dto.LeaveTypeResponse;
import com.office.brewdesk.leave.service.LeaveTypeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/admin/leave/types")
@RequiredArgsConstructor
public class LeaveAdminTypeController {

    private final LeaveTypeService leaveTypeService;

    private static final String MGMT = "hasAnyRole('SUPER_ADMIN','ADMIN')";

    @GetMapping
    @PreAuthorize(MGMT)
    public ResponseEntity<List<LeaveTypeResponse>> getAll() {
        return ResponseEntity.ok(leaveTypeService.getAllLeaveTypes());
    }

    @PostMapping
    @PreAuthorize(MGMT)
    public ResponseEntity<LeaveTypeResponse> create(@Valid @RequestBody CreateLeaveTypeRequest req) {
        LeaveTypeResponse resp = leaveTypeService.create(req);
        return ResponseEntity.created(URI.create("/api/admin/leave/types/" + resp.getId())).body(resp);
    }

    @PutMapping("/{id}")
    @PreAuthorize(MGMT)
    public ResponseEntity<LeaveTypeResponse> update(
            @PathVariable Long id, @Valid @RequestBody CreateLeaveTypeRequest req) {
        return ResponseEntity.ok(leaveTypeService.update(id, req));
    }

    @PutMapping("/{id}/activate")
    @PreAuthorize(MGMT)
    public ResponseEntity<LeaveTypeResponse> activate(@PathVariable Long id) {
        return ResponseEntity.ok(leaveTypeService.setActive(id, true));
    }

    @PutMapping("/{id}/deactivate")
    @PreAuthorize(MGMT)
    public ResponseEntity<LeaveTypeResponse> deactivate(@PathVariable Long id) {
        return ResponseEntity.ok(leaveTypeService.setActive(id, false));
    }
}

package com.office.brewdesk.leave.controller;

import com.office.brewdesk.leave.dto.*;
import com.office.brewdesk.leave.service.LeavePolicyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/admin/leave/policies")
@RequiredArgsConstructor
public class LeaveAdminPolicyController {

    private final LeavePolicyService policyService;

    private static final String MGMT = "hasAnyRole('SUPER_ADMIN','ADMIN')";

    @GetMapping
    @PreAuthorize(MGMT)
    public ResponseEntity<List<LeavePolicyResponse>> getAll() {
        return ResponseEntity.ok(policyService.getAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize(MGMT)
    public ResponseEntity<LeavePolicyResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(policyService.getById(id));
    }

    @PostMapping
    @PreAuthorize(MGMT)
    public ResponseEntity<LeavePolicyResponse> create(@Valid @RequestBody CreateLeavePolicyRequest req) {
        LeavePolicyResponse resp = policyService.create(req);
        return ResponseEntity.created(URI.create("/api/admin/leave/policies/" + resp.getId())).body(resp);
    }

    @PutMapping("/{id}")
    @PreAuthorize(MGMT)
    public ResponseEntity<LeavePolicyResponse> update(
            @PathVariable Long id, @Valid @RequestBody CreateLeavePolicyRequest req) {
        return ResponseEntity.ok(policyService.update(id, req));
    }

    @PostMapping("/{id}/departments")
    @PreAuthorize(MGMT)
    public ResponseEntity<LeavePolicyResponse> assignDepartment(
            @PathVariable Long id, @Valid @RequestBody AssignDepartmentRequest req) {
        return ResponseEntity.ok(policyService.assignDepartment(id, req.getDepartmentId()));
    }

    @DeleteMapping("/{id}/departments/{departmentId}")
    @PreAuthorize(MGMT)
    public ResponseEntity<LeavePolicyResponse> removeDepartment(
            @PathVariable Long id, @PathVariable Long departmentId) {
        return ResponseEntity.ok(policyService.removeDepartment(id, departmentId));
    }

    @PutMapping("/{id}/activate")
    @PreAuthorize(MGMT)
    public ResponseEntity<LeavePolicyResponse> activate(@PathVariable Long id) {
        return ResponseEntity.ok(policyService.setActive(id, true));
    }

    @PutMapping("/{id}/deactivate")
    @PreAuthorize(MGMT)
    public ResponseEntity<LeavePolicyResponse> deactivate(@PathVariable Long id) {
        return ResponseEntity.ok(policyService.setActive(id, false));
    }
}

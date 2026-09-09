package com.office.brewdesk.attendance.controller;

import com.office.brewdesk.attendance.dto.*;
import com.office.brewdesk.attendance.enums.RegularizationStatus;
import com.office.brewdesk.attendance.enums.RegularizationType;
import com.office.brewdesk.attendance.service.RegularizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

/**
 * REST controller for attendance regularization.
 *
 * URL prefix: /api/attendance/regularization
 *
 * Security:
 *   ALL_STAFF can reach the /api/attendance/** filter in SecurityConfig.
 *   Fine-grained access is enforced per endpoint via @PreAuthorize.
 *
 * Employee:
 *   POST   /api/attendance/regularization                  — submit
 *   GET    /api/attendance/regularization/my               — own requests
 *   GET    /api/attendance/regularization/{id}             — detail (own)
 *   POST   /api/attendance/regularization/{id}/cancel      — cancel own PENDING
 *
 * Manager:
 *   GET    /api/attendance/regularization/pending          — pending queue
 *   GET    /api/attendance/regularization/pending/count    — badge count
 *   POST   /api/attendance/regularization/{id}/approve     — approve
 *   POST   /api/attendance/regularization/{id}/reject      — reject
 *
 * Admin/HR:
 *   GET    /api/attendance/regularization/all              — all requests (filtered)
 */
@RestController
@RequestMapping("/api/attendance/regularization")
@RequiredArgsConstructor
public class RegularizationController {

    private final RegularizationService service;

    // ── Employee endpoints ────────────────────────────────────────────────────

    /** Submit a new regularization request. */
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','REPORTING_MANAGER','CHEF','EMPLOYEE')")
    public ResponseEntity<RegularizationRequestResponse> submit(
            @Valid @RequestBody SubmitRegularizationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.submit(request));
    }

    /** Employee's own request list (newest first). */
    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','REPORTING_MANAGER','CHEF','EMPLOYEE')")
    public ResponseEntity<RegularizationRequestPageResponse> myRequests(
            @RequestParam(required = false) RegularizationStatus status,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(service.getMyRequests(status, page, size));
    }

    /** Detail view — returns full request including current attendance snapshot. */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','REPORTING_MANAGER','CHEF','EMPLOYEE')")
    public ResponseEntity<RegularizationRequestResponse> getById(
            @PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    /** Cancel own PENDING request. */
    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','REPORTING_MANAGER','CHEF','EMPLOYEE')")
    public ResponseEntity<RegularizationRequestResponse> cancel(
            @PathVariable Long id) {
        return ResponseEntity.ok(service.cancel(id));
    }

    // ── Manager endpoints ─────────────────────────────────────────────────────

    /** Pending requests for the authenticated manager's team (oldest first). */
    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','REPORTING_MANAGER')")
    public ResponseEntity<RegularizationRequestPageResponse> pendingQueue(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(service.getPendingForManager(page, size));
    }

    /** Count of PENDING requests for the authenticated manager — for badge. */
    @GetMapping("/pending/count")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','REPORTING_MANAGER')")
    public ResponseEntity<Map<String, Long>> pendingCount() {
        return ResponseEntity.ok(Map.of("count", service.countPendingForManager()));
    }

    /** Approve a PENDING request. */
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','REPORTING_MANAGER')")
    public ResponseEntity<RegularizationRequestResponse> approve(
            @PathVariable Long id) {
        return ResponseEntity.ok(service.approve(id));
    }

    /** Reject a PENDING request — rejection reason is mandatory. */
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','REPORTING_MANAGER')")
    public ResponseEntity<RegularizationRequestResponse> reject(
            @PathVariable Long id,
            @Valid @RequestBody RejectRegularizationRequest request) {
        return ResponseEntity.ok(service.reject(id, request));
    }

    // ── Admin / HR endpoints ──────────────────────────────────────────────────

    /** All requests with optional filters — admin / HR monitoring view. */
    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<RegularizationRequestPageResponse> all(
            @RequestParam(required = false) String employeeCode,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) RegularizationStatus status,
            @RequestParam(required = false) RegularizationType    type,
            @RequestParam(defaultValue = "0")   int page,
            @RequestParam(defaultValue = "20")  int size) {
        return ResponseEntity.ok(
                service.getAllRequests(employeeCode, dateFrom, dateTo,
                        status, type, page, size));
    }
}

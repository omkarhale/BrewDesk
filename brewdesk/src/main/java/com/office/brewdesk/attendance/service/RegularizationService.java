package com.office.brewdesk.attendance.service;

import com.office.brewdesk.attendance.dto.*;
import com.office.brewdesk.attendance.entity.*;
import com.office.brewdesk.attendance.enums.RegularizationStatus;
import com.office.brewdesk.attendance.enums.RegularizationType;
import com.office.brewdesk.attendance.repository.*;
import com.office.brewdesk.entity.User;
import com.office.brewdesk.enums.Role;
import com.office.brewdesk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Core workflow service for attendance regularization requests.
 *
 * Responsibilities:
 *   - Submit a new request (employee)
 *   - Cancel own PENDING request (employee)
 *   - Approve a PENDING request (manager / admin)
 *   - Reject  a PENDING request (manager / admin)
 *   - Paginated list views for employee, manager, admin
 *   - DTO mapping
 *
 * Attendance correction on approval is delegated to
 * {@link AttendanceCorrectionService} to keep calculation logic isolated.
 * It is injected via @Autowired setter to break the potential Spring
 * circular-dependency between this service and AttendanceCalculationService.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class RegularizationService {

    private final RegularizationRequestRepository  requestRepository;
    private final RegularizationAttachmentRepository attachmentRepository;
    private final EmployeeProfileRepository          employeeProfileRepository;
    private final AttendanceRecordRepository         attendanceRecordRepository;
    private final UserRepository                     userRepository;
    private final AttendanceCalculationService       calculationService;

    /** Injected after construction to avoid circular dependency. */
    private AttendanceCorrectionService correctionService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    public void setCorrectionService(AttendanceCorrectionService correctionService) {
        this.correctionService = correctionService;
    }

    // ── Resolve helpers ───────────────────────────────────────────────────────

    private User resolveCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"));
    }

    private EmployeeProfile resolveEmployeeProfile(User user) {
        return employeeProfileRepository.findByUser(user)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No employee profile linked to your account. Contact HR."));
    }

    private static boolean isManagementRole(User u) {
        return u.getRole() == Role.SUPER_ADMIN || u.getRole() == Role.ADMIN;
    }

    /**
     * True when the viewer is allowed to VIEW this request:
     *   - the employee who submitted it
     *   - the employee's configured reporting manager (if set)
     *   - any ADMIN / SUPER_ADMIN
     */
    private static boolean canView(User viewer, RegularizationRequest e) {
        if (isManagementRole(viewer)) return true;
        EmployeeProfile emp = e.getEmployee();
        if (emp.getUser() != null && emp.getUser().getId().equals(viewer.getId())) return true;
        if (emp.getManager() != null && emp.getManager().getId().equals(viewer.getId())) return true;
        return false;
    }

    /**
     * True when the reviewer may APPROVE / REJECT this request:
     *   - ADMIN / SUPER_ADMIN (override / exception handling)
     *   - the employee's configured reporting manager (User at emp.manager)
     * A user may never act on their own request regardless of role.
     */
    private static boolean canActOn(User reviewer, RegularizationRequest e) {
        if (e.getEmployee().getUser() != null
                && e.getEmployee().getUser().getId().equals(reviewer.getId())) {
            return false;
        }
        if (isManagementRole(reviewer)) return true;
        User manager = e.getEmployee().getManager();
        return manager != null && manager.getId().equals(reviewer.getId());
    }

    /** Throws if reviewer cannot act on this request. */
    private void requireCanActOn(User reviewer, RegularizationRequest e) {
        if (!canActOn(reviewer, e)) {
            throw new IllegalStateException(
                    "You are not authorized to act on this regularization request");
        }
    }

    /** Throws if viewer cannot see this request. */
    private void requireCanView(User viewer, RegularizationRequest e) {
        if (!canView(viewer, e)) {
            throw new IllegalArgumentException(
                    "Regularization request not found");
        }
    }

    // ── Submit ────────────────────────────────────────────────────────────────

    public RegularizationRequestResponse submit(SubmitRegularizationRequest request) {

        User            currentUser = resolveCurrentUser();
        EmployeeProfile employee    = resolveEmployeeProfile(currentUser);

        if (!Boolean.TRUE.equals(employee.getActive())) {
            throw new IllegalStateException(
                    "Inactive employees cannot submit regularization requests");
        }
        if (request.getAttendanceDate().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Attendance date cannot be in the future");
        }

        validateFieldsByType(request, employee);

        boolean duplicate = requestRepository
                .existsByEmployeeIdAndAttendanceDateAndTypeAndStatusIn(
                        employee.getId(),
                        request.getAttendanceDate(),
                        request.getType(),
                        List.of(RegularizationStatus.PENDING,
                                RegularizationStatus.APPROVED));
        if (duplicate) {
            throw new IllegalStateException(
                    "A pending or approved request already exists for this date and type");
        }

        AttendanceRecord existingRecord = attendanceRecordRepository
                .findByEmployeeIdAndAttendanceDate(
                        employee.getId(), request.getAttendanceDate())
                .orElse(null);

        RegularizationRequest entity = RegularizationRequest.builder()
                .employee(employee)
                .attendanceDate(request.getAttendanceDate())
                .attendanceRecord(existingRecord)
                .type(request.getType())
                .requestedPunchIn(request.getRequestedPunchIn())
                .requestedPunchOut(request.getRequestedPunchOut())
                .halfDayType(request.getHalfDayType())
                .reason(request.getReason().strip())
                .status(RegularizationStatus.PENDING)
                .build();

        return mapToDetailResponse(requestRepository.save(entity));
    }

    // ── Cancel ────────────────────────────────────────────────────────────────

    public RegularizationRequestResponse cancel(Long requestId) {

        User            currentUser = resolveCurrentUser();
        EmployeeProfile employee    = resolveEmployeeProfile(currentUser);

        RegularizationRequest entity = requestRepository
                .findByIdAndEmployeeId(requestId, employee.getId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Request not found or does not belong to you"));

        if (entity.getStatus() != RegularizationStatus.PENDING) {
            throw new IllegalStateException(
                    "Only PENDING requests can be cancelled. Status: " + entity.getStatus());
        }

        entity.setStatus(RegularizationStatus.CANCELLED);
        return mapToDetailResponse(requestRepository.save(entity));
    }

    // ── Approve ───────────────────────────────────────────────────────────────

    public RegularizationRequestResponse approve(Long requestId) {

        User                  reviewer = resolveCurrentUser();
        RegularizationRequest entity   = requirePending(requestId);

        requireCanActOn(reviewer, entity);

        entity.setStatus(RegularizationStatus.APPROVED);
        entity.setReviewedBy(reviewer);
        entity.setReviewedAt(LocalDateTime.now());

        RegularizationRequest saved = requestRepository.save(entity);

        // Phase 7 — apply the correction to attendance
        if (correctionService != null) {
            correctionService.applyCorrection(saved);
        }

        return mapToDetailResponse(saved);
    }

    // ── Reject ────────────────────────────────────────────────────────────────

    public RegularizationRequestResponse reject(Long requestId,
                                                RejectRegularizationRequest dto) {

        User                  reviewer = resolveCurrentUser();
        RegularizationRequest entity   = requirePending(requestId);

        requireCanActOn(reviewer, entity);

        entity.setStatus(RegularizationStatus.REJECTED);
        entity.setReviewedBy(reviewer);
        entity.setReviewedAt(LocalDateTime.now());
        entity.setRejectionReason(dto.getRejectionReason().strip());

        return mapToDetailResponse(requestRepository.save(entity));
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public RegularizationRequestResponse getById(Long requestId) {
        User viewer = resolveCurrentUser();
        RegularizationRequest entity = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Regularization request not found"));
        requireCanView(viewer, entity);
        return mapToDetailResponse(entity);
    }

    // Employee — own requests
    @Transactional(readOnly = true)
    public RegularizationRequestPageResponse getMyRequests(
            RegularizationStatus status, int page, int size) {

        User            user     = resolveCurrentUser();
        EmployeeProfile employee = resolveEmployeeProfile(user);

        int clamped = Math.min(size, 50);
        org.springframework.data.domain.Pageable pg =
                PageRequest.of(page, clamped,
                        Sort.by(Sort.Direction.DESC, "submittedAt"));

        Page<RegularizationRequest> result = (status != null)
                ? requestRepository.findByEmployeeIdAndStatusOrderBySubmittedAtDesc(
                        employee.getId(), status, pg)
                : requestRepository.findByEmployeeIdOrderBySubmittedAtDesc(
                        employee.getId(), pg);

        return toPage(result);
    }

    // Manager — pending queue
    @Transactional(readOnly = true)
    public RegularizationRequestPageResponse getPendingForManager(int page, int size) {

        User manager = resolveCurrentUser();
        int  clamped = Math.min(size, 50);
        org.springframework.data.domain.Pageable pg =
                PageRequest.of(page, clamped,
                        Sort.by(Sort.Direction.ASC, "submittedAt"));

        Page<RegularizationRequest> result =
                requestRepository.findByEmployeeManagerAndStatusOrderBySubmittedAtAsc(
                        manager, RegularizationStatus.PENDING, pg);

        return toPage(result);
    }

    @Transactional(readOnly = true)
    public long countPendingForManager() {
        User manager = resolveCurrentUser();
        return requestRepository.countByEmployeeManagerAndStatus(
                manager, RegularizationStatus.PENDING);
    }

    // Admin — all requests
    @Transactional(readOnly = true)
    public RegularizationRequestPageResponse getAllRequests(
            String             employeeCode,
            LocalDate          dateFrom,
            LocalDate          dateTo,
            RegularizationStatus status,
            RegularizationType   type,
            int page,
            int size) {

        int clamped = Math.min(size, 100);
        var spec = RegularizationRequestSpecification.withFilters(
                employeeCode, dateFrom, dateTo, status, type, null);
        Page<RegularizationRequest> result = requestRepository.findAll(
                spec, PageRequest.of(page, clamped,
                        Sort.by(Sort.Direction.DESC, "submittedAt")));
        return toPage(result);
    }

    // ── Validation ────────────────────────────────────────────────────────────

    /**
     * Backend is authoritative on field requirements per the prompt spec.
     * Frontend mirrors these via Zod, but the backend enforces them.
     *
     * Additionally validates that requested times are compatible with the
     * employee's configured shift (accounting for overnight shifts and grace
     * tolerance).
     */
    private void validateFieldsByType(SubmitRegularizationRequest r,
                                      EmployeeProfile employee) {

        if (r.getType() != RegularizationType.HALF_DAY && r.getHalfDayType() != null) {
            throw new IllegalArgumentException(
                    "halfDayType must only be set for HALF_DAY requests");
        }

        switch (r.getType()) {
            case MISSED_PUNCH -> {
                if (r.getRequestedPunchIn() == null && r.getRequestedPunchOut() == null) {
                    throw new IllegalArgumentException(
                            "MISSED_PUNCH requires at least one of requestedPunchIn or requestedPunchOut");
                }
            }
            case INCORRECT_PUNCH, FULL_DAY -> {
                if (r.getRequestedPunchIn() == null || r.getRequestedPunchOut() == null) {
                    throw new IllegalArgumentException(
                            r.getType() + " requires both requestedPunchIn and requestedPunchOut");
                }
            }
            case LATE_ARRIVAL -> {
                if (r.getRequestedPunchIn() == null) {
                    throw new IllegalArgumentException(
                            "LATE_ARRIVAL requires requestedPunchIn");
                }
            }
            case EARLY_EXIT -> {
                if (r.getRequestedPunchOut() == null) {
                    throw new IllegalArgumentException(
                            "EARLY_EXIT requires requestedPunchOut");
                }
            }
            case HALF_DAY -> {
                if (r.getHalfDayType() == null) {
                    throw new IllegalArgumentException(
                            "HALF_DAY requires halfDayType (FIRST_HALF or SECOND_HALF)");
                }
            }
        }

        // When both supplied, out must be strictly after in
        if (r.getRequestedPunchIn() != null && r.getRequestedPunchOut() != null
                && !r.getRequestedPunchOut().isAfter(r.getRequestedPunchIn())) {
            throw new IllegalArgumentException(
                    "requestedPunchOut must be after requestedPunchIn");
        }

        // ── Shift-compatibility validation ──────────────────────────────────
        // HALF_DAY has no explicit punch times; skip this check for it.
        if (r.getType() == RegularizationType.HALF_DAY) return;

        Shift shift = employee.getShift();
        if (shift == null) return; // no shift configured; can't validate

        LocalTime sStart = shift.getStartTime();
        LocalTime sEnd   = shift.getEndTime();
        if (sStart == null || sEnd == null) return;

        // For overnight shifts (end <= start) the logical end is on day+1.
        boolean overnight = !sEnd.isAfter(sStart);

        int graceMinutes = shift.getGraceMinutes() != null ? shift.getGraceMinutes() : 0;

        validatePunchInWindow(r.getRequestedPunchIn(),
                r.getAttendanceDate(), sStart, overnight, graceMinutes);
        validatePunchOutWindow(r.getRequestedPunchOut(),
                r.getAttendanceDate(), sStart, sEnd, overnight, graceMinutes);
    }

    /** Punch-in must fall on attendance date within [shiftStart - grace, shiftStart + grace]. */
    private static void validatePunchInWindow(LocalDateTime punchIn,
                                              LocalDate     attendanceDate,
                                              LocalTime     shiftStart,
                                              boolean       overnight,
                                              int           graceMinutes) {
        if (punchIn == null) return;

        if (!punchIn.toLocalDate().isEqual(attendanceDate)) {
            throw new IllegalArgumentException(
                    "requestedPunchIn must be on the attendance date");
        }

        LocalDateTime startBound = LocalDateTime.of(attendanceDate, shiftStart);
        LocalDateTime lo = startBound.minusMinutes(graceMinutes);
        LocalDateTime hi = startBound.plusMinutes(graceMinutes);

        // Loose tolerance: allow up to 4 hours after shift start as a valid
        // "late arrival" punch for LATE_ARRIVAL / MISSED_PUNCH IN. Grace is
        // only for official lateness marking; but we still want a sane bound.
        if (punchIn.isBefore(lo)) {
            throw new IllegalArgumentException(
                    "requestedPunchIn is too early for the assigned shift");
        }
    }

    /** Punch-out must fall inside shift window (optionally day+1 for overnight). */
    private static void validatePunchOutWindow(LocalDateTime punchOut,
                                               LocalDate     attendanceDate,
                                               LocalTime     shiftStart,
                                               LocalTime     shiftEnd,
                                               boolean       overnight,
                                               int           graceMinutes) {
        if (punchOut == null) return;

        LocalDate outDate = punchOut.toLocalDate();
        LocalDate expectedOutDate = overnight
                ? attendanceDate.plusDays(1)
                : attendanceDate;

        if (!outDate.isEqual(expectedOutDate)) {
            throw new IllegalArgumentException(
                    "requestedPunchOut does not fall on the expected date for the assigned shift");
        }

        LocalDateTime endBound = LocalDateTime.of(expectedOutDate, shiftEnd);
        LocalDateTime hi = endBound.plusMinutes(graceMinutes);

        if (punchOut.isAfter(hi)) {
            throw new IllegalArgumentException(
                    "requestedPunchOut is too late for the assigned shift");
        }
    }

    // ── Mapping ───────────────────────────────────────────────────────────────

    public RegularizationRequestResponse mapToDetailResponse(RegularizationRequest e) {

        EmployeeProfile emp = e.getEmployee();
        AttendanceRecord rec = e.getAttendanceRecord();

        return RegularizationRequestResponse.builder()
                .id(e.getId())
                .employeeId(emp.getId())
                .employeeCode(emp.getEmployeeCode())
                .employeeName(emp.getUser() != null ? emp.getUser().getName() : null)
                .managerId(emp.getManager() != null ? emp.getManager().getId() : null)
                .managerName(emp.getManager() != null ? emp.getManager().getName() : null)
                .attendanceDate(e.getAttendanceDate())
                .type(e.getType())
                .requestedPunchIn(e.getRequestedPunchIn())
                .requestedPunchOut(e.getRequestedPunchOut())
                .halfDayType(e.getHalfDayType())
                .reason(e.getReason())
                .currentAttendance(rec != null ? calculationService.mapToResponse(rec) : null)
                .status(e.getStatus())
                .reviewedById(e.getReviewedBy() != null ? e.getReviewedBy().getId() : null)
                .reviewedByName(e.getReviewedBy() != null ? e.getReviewedBy().getName() : null)
                .rejectionReason(e.getRejectionReason())
                .reviewedAt(e.getReviewedAt())
                .attachments(e.getAttachments().stream()
                        .map(this::mapAttachment).toList())
                .submittedAt(e.getSubmittedAt())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }

    public RegularizationRequestSummaryResponse mapToSummaryResponse(
            RegularizationRequest e) {
        // Fallback — only used for single-row cases. List views use the
        // pre-computed attachment-count overload to avoid N+1 queries.
        return mapToSummaryResponse(e, !e.getAttachments().isEmpty());
    }

    /** Summary mapper with pre-computed hasAttachments flag (batched). */
    private RegularizationRequestSummaryResponse mapToSummaryResponse(
            RegularizationRequest e, boolean hasAttachments) {

        EmployeeProfile  emp = e.getEmployee();
        AttendanceRecord rec = e.getAttendanceRecord();

        return RegularizationRequestSummaryResponse.builder()
                .id(e.getId())
                .employeeId(emp.getId())
                .employeeCode(emp.getEmployeeCode())
                .employeeName(emp.getUser() != null ? emp.getUser().getName() : null)
                .attendanceDate(e.getAttendanceDate())
                .type(e.getType())
                .requestedPunchIn(e.getRequestedPunchIn())
                .requestedPunchOut(e.getRequestedPunchOut())
                .currentAttendanceStatus(rec != null ? rec.getStatus().name() : null)
                .status(e.getStatus())
                .reviewedByName(e.getReviewedBy() != null
                        ? e.getReviewedBy().getName() : null)
                .reviewedAt(e.getReviewedAt())
                .hasAttachments(hasAttachments)
                .submittedAt(e.getSubmittedAt())
                .build();
    }

    public RegularizationAttachmentResponse mapAttachmentPublic(RegularizationAttachment a) {
        return mapAttachment(a);
    }

    private RegularizationAttachmentResponse mapAttachment(RegularizationAttachment a) {
        return RegularizationAttachmentResponse.builder()
                .id(a.getId())
                .originalFilename(a.getOriginalFilename())
                .contentType(a.getContentType())
                .fileSizeBytes(a.getFileSizeBytes())
                .uploadedById(a.getUploadedBy().getId())
                .uploadedByName(a.getUploadedBy().getName())
                .uploadedAt(a.getUploadedAt())
                .build();
    }

    private RegularizationRequestPageResponse toPage(Page<RegularizationRequest> p) {
        List<RegularizationRequest> items = p.getContent();

        // Single SQL to detect which requests on this page have attachments,
        // instead of firing one query per row (N+1).
        Map<Long, Long> attachmentCounts = new HashMap<>();
        if (!items.isEmpty()) {
            List<Long> ids = items.stream()
                    .map(RegularizationRequest::getId).toList();
            for (Object[] row : attachmentRepository.countByRequestIdsGrouped(ids)) {
                attachmentCounts.put((Long) row[0], (Long) row[1]);
            }
        }

        return RegularizationRequestPageResponse.builder()
                .content(items.stream()
                        .map(e -> mapToSummaryResponse(
                                e,
                                attachmentCounts.getOrDefault(e.getId(), 0L) > 0))
                        .toList())
                .pageNumber(p.getNumber())
                .pageSize(p.getSize())
                .totalElements(p.getTotalElements())
                .totalPages(p.getTotalPages())
                .first(p.isFirst())
                .last(p.isLast())
                .build();
    }

    private RegularizationRequest requirePending(Long id) {
        RegularizationRequest e = requestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Regularization request not found"));
        if (e.getStatus() != RegularizationStatus.PENDING) {
            throw new IllegalStateException(
                    "Request is not PENDING. Status: " + e.getStatus());
        }
        return e;
    }
}

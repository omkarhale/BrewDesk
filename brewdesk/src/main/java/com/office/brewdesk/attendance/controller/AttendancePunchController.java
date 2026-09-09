package com.office.brewdesk.attendance.controller;

import com.office.brewdesk.attendance.dto.EmployeeResponse;
import com.office.brewdesk.attendance.dto.WebPunchResponse;
import com.office.brewdesk.attendance.entity.EmployeeProfile;
import com.office.brewdesk.attendance.repository.EmployeeProfileRepository;
import com.office.brewdesk.attendance.service.AttendanceEventService;
import com.office.brewdesk.entity.User;
import com.office.brewdesk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * Production punch endpoints available to all authenticated employees.
 *
 * POST /api/attendance/punch  — self-service web punch (no body required)
 * GET  /api/attendance/employees/me — own employee profile from JWT
 */
@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendancePunchController {

    private final AttendanceEventService attendanceEventService;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final UserRepository userRepository;

    /**
     * Records a punch event for the currently authenticated user.
     * No request body needed — time, source and employee are all derived server-side.
     */
    @PostMapping("/punch")
    public ResponseEntity<WebPunchResponse> punch() {
        return ResponseEntity.ok(attendanceEventService.webPunch());
    }

    /**
     * Returns the employee profile linked to the authenticated user's account.
     * Used by the frontend punch widget to resolve the employee code / shift.
     */
    @GetMapping("/employees/me")
    public ResponseEntity<EmployeeResponse> getMyProfile() {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        EmployeeProfile profile = employeeProfileRepository.findByUser(user)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No employee profile linked to this account"));

        return ResponseEntity.ok(buildResponse(profile));
    }

    private EmployeeResponse buildResponse(EmployeeProfile p) {
        return EmployeeResponse.builder()
                .id(p.getId())
                .userId(p.getUser().getId())
                .userName(p.getUser() != null ? p.getUser().getName() : null)
                .employeeCode(p.getEmployeeCode())
                .departmentId(p.getDepartment() != null ? p.getDepartment().getId() : null)
                .departmentName(p.getDepartment() != null ? p.getDepartment().getName() : null)
                .shiftId(p.getShift() != null ? p.getShift().getId() : null)
                .shiftName(p.getShift() != null ? p.getShift().getName() : null)
                .designation(p.getDesignation())
                .managerId(p.getManager() != null ? p.getManager().getId() : null)
                .joiningDate(p.getJoiningDate())
                .active(p.getActive())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}

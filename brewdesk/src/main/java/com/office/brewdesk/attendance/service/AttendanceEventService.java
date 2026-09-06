package com.office.brewdesk.attendance.service;

import com.office.brewdesk.attendance.dto.AttendanceEventResponse;
import com.office.brewdesk.attendance.dto.SimulateAttendanceRequest;
import com.office.brewdesk.attendance.dto.WebPunchResponse;
import com.office.brewdesk.attendance.entity.AttendanceEvent;
import com.office.brewdesk.attendance.entity.EmployeeProfile;
import com.office.brewdesk.attendance.enums.AttendanceEventType;
import com.office.brewdesk.attendance.enums.AttendanceSource;
import com.office.brewdesk.attendance.repository.AttendanceEventRepository;
import com.office.brewdesk.attendance.repository.EmployeeProfileRepository;
import com.office.brewdesk.entity.User;
import com.office.brewdesk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class AttendanceEventService {

    private final AttendanceEventRepository attendanceEventRepository;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final UserRepository userRepository;

    // ── Simulator (dev only) ──────────────────────────────────────────────────

    public AttendanceEventResponse simulatePunch(
            SimulateAttendanceRequest request
    ) {
        EmployeeProfile employee =
                employeeProfileRepository
                        .findByEmployeeCode(request.getEmployeeCode().trim())
                        .orElseThrow(() ->
                                new IllegalArgumentException("Employee not found"));

        AttendanceEvent event = AttendanceEvent.builder()
                .employee(employee)
                .eventType(request.getEventType())
                .eventTime(request.getEventTime())
                .attendanceSource(request.getSource())
                .externalEventId(request.getExternalEventId())
                .rawPayload("SIMULATED_EVENT")
                .build();

        AttendanceEvent savedEvent = attendanceEventRepository.save(event);
        return mapToResponse(savedEvent);
    }

    // ── Web self-service punch (production) ───────────────────────────────────

    /**
     * Records a PUNCH event for the currently authenticated user.
     * The employee profile is resolved from the JWT subject (email).
     * Uses current server time as the event time.
     * Generates a unique external event ID automatically.
     */
    public WebPunchResponse webPunch() {

        // Resolve authenticated user from security context
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        EmployeeProfile employee = employeeProfileRepository.findByUser(user)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No employee profile found for this account. " +
                        "Please contact your HR admin to set up your profile."));

        LocalDateTime now = LocalDateTime.now();

        // Generate a collision-safe external event ID
        String externalEventId = "WEB-" + employee.getEmployeeCode()
                + "-" + now.toLocalDate()
                + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        AttendanceEvent event = AttendanceEvent.builder()
                .employee(employee)
                .eventType(AttendanceEventType.PUNCH)
                .eventTime(now)
                .attendanceSource(AttendanceSource.WEB)
                .externalEventId(externalEventId)
                .rawPayload("WEB_SELF_SERVICE")
                .build();

        AttendanceEvent savedEvent = attendanceEventRepository.save(event);

        return WebPunchResponse.builder()
                .eventId(savedEvent.getId())
                .employeeCode(employee.getEmployeeCode())
                .eventTime(savedEvent.getEventTime())
                .source(AttendanceSource.WEB.name())
                .eventType(AttendanceEventType.PUNCH.name())
                .message("Punch recorded successfully at " + now.toLocalTime()
                        .withNano(0).toString())
                .build();
    }

    // ── Shared mapping ────────────────────────────────────────────────────────

    private AttendanceEventResponse mapToResponse(AttendanceEvent event) {
        return AttendanceEventResponse.builder()
                .id(event.getId())
                .employeeId(event.getEmployee().getId())
                .employeeCode(event.getEmployee().getEmployeeCode())
                .eventType(event.getEventType())
                .source(event.getAttendanceSource())
                .eventTime(event.getEventTime())
                .externalEventId(event.getExternalEventId())
                .createdAt(event.getCreatedAt())
                .build();
    }
}
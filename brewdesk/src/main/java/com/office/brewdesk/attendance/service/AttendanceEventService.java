package com.office.brewdesk.attendance.service;

import com.office.brewdesk.attendance.dto.AttendanceEventPageResponse;
import com.office.brewdesk.attendance.dto.AttendanceEventResponse;
import com.office.brewdesk.attendance.dto.SimulateAttendanceRequest;
import com.office.brewdesk.attendance.dto.WebPunchResponse;
import com.office.brewdesk.attendance.entity.AttendanceEvent;
import com.office.brewdesk.attendance.entity.EmployeeProfile;
import com.office.brewdesk.attendance.enums.AttendanceEventType;
import com.office.brewdesk.attendance.enums.AttendanceSource;
import com.office.brewdesk.attendance.repository.AttendanceEventRepository;
import com.office.brewdesk.attendance.repository.AttendanceEventSpecification;
import com.office.brewdesk.attendance.repository.EmployeeProfileRepository;
import com.office.brewdesk.entity.User;
import com.office.brewdesk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class AttendanceEventService {

    private final AttendanceEventRepository attendanceEventRepository;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final UserRepository userRepository;

    // -- Dev simulator ---------------------------------------------------------

    public AttendanceEventResponse simulatePunch(SimulateAttendanceRequest request) {
        EmployeeProfile employee = employeeProfileRepository
                .findByEmployeeCode(request.getEmployeeCode().trim())
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));
        AttendanceEvent event = AttendanceEvent.builder()
                .employee(employee)
                .eventType(request.getEventType())
                .eventTime(request.getEventTime())
                .attendanceSource(request.getSource())
                .externalEventId(request.getExternalEventId())
                .rawPayload("SIMULATED_EVENT")
                .build();
        return mapToResponse(attendanceEventRepository.save(event));
    }

    // -- Web self-service punch ------------------------------------------------

    public WebPunchResponse webPunch() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        EmployeeProfile employee = employeeProfileRepository.findByUser(user)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No employee profile found for this account. " +
                        "Please contact your HR admin to set up your profile."));
        LocalDateTime now = LocalDateTime.now();
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
                .message("Punch recorded successfully at " + now.toLocalTime().withNano(0))
                .build();
    }

    // -- Paged audit log -------------------------------------------------------

    @Transactional(readOnly = true)
    public AttendanceEventPageResponse getEvents(
            String employeeCode,
            LocalDate dateFrom,
            LocalDate dateTo,
            int page,
            int size) {
        int clampedSize = Math.min(size, 200);
        var spec = AttendanceEventSpecification.withFilters(
                employeeCode,
                dateFrom != null ? dateFrom.atStartOfDay() : null,
                dateTo   != null ? dateTo.atTime(23, 59, 59) : null
        );
        var sort = Sort.by(Sort.Direction.DESC, "eventTime");
        Page<AttendanceEvent> eventPage =
                attendanceEventRepository.findAll(spec, PageRequest.of(page, clampedSize, sort));
        return AttendanceEventPageResponse.builder()
                .content(eventPage.getContent().stream().map(this::mapToResponse).toList())
                .pageNumber(eventPage.getNumber())
                .pageSize(eventPage.getSize())
                .totalElements(eventPage.getTotalElements())
                .totalPages(eventPage.getTotalPages())
                .first(eventPage.isFirst())
                .last(eventPage.isLast())
                .build();
    }

    // -- Shared mapping --------------------------------------------------------

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

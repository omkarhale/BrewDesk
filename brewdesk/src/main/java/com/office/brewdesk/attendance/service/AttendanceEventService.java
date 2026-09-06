package com.office.brewdesk.attendance.service;

import com.office.brewdesk.attendance.dto.AttendanceEventResponse;
import com.office.brewdesk.attendance.dto.SimulateAttendanceRequest;
import com.office.brewdesk.attendance.entity.AttendanceEvent;
import com.office.brewdesk.attendance.entity.EmployeeProfile;
import com.office.brewdesk.attendance.repository.AttendanceEventRepository;
import com.office.brewdesk.attendance.repository.EmployeeProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AttendanceEventService {

    private final AttendanceEventRepository attendanceEventRepository;
    private final EmployeeProfileRepository employeeProfileRepository;

    public AttendanceEventResponse simulatePunch(
            SimulateAttendanceRequest request
    ) {

        EmployeeProfile employee =
                employeeProfileRepository
                        .findByEmployeeCode(request.getEmployeeCode().trim())
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Employee not found"
                                ));

        AttendanceEvent event = AttendanceEvent.builder()
                .employee(employee)
                .eventType(request.getEventType())
                .eventTime(request.getEventTime())
                .attendanceSource(request.getSource())
                .externalEventId(request.getExternalEventId())
                .rawPayload("SIMULATED_EVENT")
                .build();

        AttendanceEvent savedEvent =
                attendanceEventRepository.save(event);

        return mapToResponse(savedEvent);
    }

    private AttendanceEventResponse mapToResponse(
            AttendanceEvent event
    ) {

        return AttendanceEventResponse.builder()
                .id(event.getId())
                .employeeId(event.getEmployee().getId())
                .employeeCode(
                        event.getEmployee().getEmployeeCode()
                )
                .eventType(event.getEventType())
                .source(event.getAttendanceSource())
                .eventTime(event.getEventTime())
                .externalEventId(event.getExternalEventId())
                .createdAt(event.getCreatedAt())
                .build();
    }
}
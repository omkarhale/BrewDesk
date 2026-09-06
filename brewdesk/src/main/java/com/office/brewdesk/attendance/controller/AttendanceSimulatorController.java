package com.office.brewdesk.attendance.controller;

import com.office.brewdesk.attendance.dto.AttendanceEventResponse;
import com.office.brewdesk.attendance.dto.SimulateAttendanceRequest;
import com.office.brewdesk.attendance.service.AttendanceEventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dev/attendance")
@RequiredArgsConstructor
public class AttendanceSimulatorController {

    private final AttendanceEventService attendanceEventService;

    @PostMapping("/simulate")
    public ResponseEntity<AttendanceEventResponse> simulatePunch(
            @Valid @RequestBody SimulateAttendanceRequest request
    ) {

        return ResponseEntity.ok(
                attendanceEventService.simulatePunch(request)
        );
    }
}
package com.office.brewdesk.attendance.controller;

import com.office.brewdesk.attendance.dto.CreateShiftRequest;
import com.office.brewdesk.attendance.dto.ShiftResponse;
import com.office.brewdesk.attendance.service.ShiftService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/attendance/shifts")
@RequiredArgsConstructor
public class ShiftController {

    private final ShiftService shiftService;

    @PostMapping
    public ResponseEntity<ShiftResponse> createShift(
            @Valid @RequestBody CreateShiftRequest request
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(shiftService.createShift(request));
    }

    @GetMapping
    public ResponseEntity<List<ShiftResponse>> getAllShifts() {

        return ResponseEntity.ok(
                shiftService.getAllShifts()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShiftResponse> getShift(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                shiftService.getShift(id)
        );
    }
}
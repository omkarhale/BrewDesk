package com.office.brewdesk.attendance.service;

import com.office.brewdesk.attendance.dto.CreateShiftRequest;
import com.office.brewdesk.attendance.dto.ShiftResponse;
import com.office.brewdesk.attendance.entity.Shift;
import com.office.brewdesk.attendance.repository.ShiftRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ShiftService {

    private final ShiftRepository shiftRepository;

    public ShiftResponse createShift(CreateShiftRequest request) {

        if (shiftRepository.existsByName(request.getName().trim())) {
            throw new IllegalArgumentException(
                    "Shift name already exists"
            );
        }

        Shift shift = Shift.builder()
                .name(request.getName().trim())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .breakMinutes(request.getBreakMinutes())
                .graceMinutes(request.getGraceMinutes())
                .minimumWorkMinutes(request.getMinimumWorkMinutes())
                .halfDayMinutes(request.getHalfDayMinutes())
                .active(true)
                .build();

        Shift savedShift = shiftRepository.save(shift);

        return mapToResponse(savedShift);
    }

    @Transactional(readOnly = true)
    public List<ShiftResponse> getAllShifts() {

        return shiftRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ShiftResponse getShift(Long id) {

        Shift shift = shiftRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Shift not found"
                        ));

        return mapToResponse(shift);
    }

    private ShiftResponse mapToResponse(Shift shift) {

        return ShiftResponse.builder()
                .id(shift.getId())
                .name(shift.getName())
                .startTime(shift.getStartTime())
                .endTime(shift.getEndTime())
                .breakMinutes(shift.getBreakMinutes())
                .graceMinutes(shift.getGraceMinutes())
                .minimumWorkMinutes(shift.getMinimumWorkMinutes())
                .halfDayMinutes(shift.getHalfDayMinutes())
                .active(shift.getActive())
                .createdAt(shift.getCreatedAt())
                .updatedAt(shift.getUpdatedAt())
                .build();
    }
}
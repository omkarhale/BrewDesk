package com.office.brewdesk.attendance.service;

import com.office.brewdesk.attendance.dto.CreateShiftRequest;
import com.office.brewdesk.attendance.dto.ShiftResponse;
import com.office.brewdesk.attendance.dto.UpdateShiftRequest;
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
            throw new IllegalArgumentException("Shift name already exists");
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
        return mapToResponse(shiftRepository.save(shift));
    }

    @Transactional(readOnly = true)
    public List<ShiftResponse> getAllShifts() {
        return shiftRepository.findAll().stream().map(this::mapToResponse).toList();
    }

    @Transactional(readOnly = true)
    public ShiftResponse getShift(Long id) {
        return mapToResponse(findById(id));
    }

    public ShiftResponse updateShift(Long id, UpdateShiftRequest request) {
        Shift shift = findById(id);
        String newName = request.getName().trim();
        if (!shift.getName().equals(newName) && shiftRepository.existsByName(newName)) {
            throw new IllegalArgumentException("Shift name already exists");
        }
        shift.setName(newName);
        shift.setStartTime(request.getStartTime());
        shift.setEndTime(request.getEndTime());
        shift.setBreakMinutes(request.getBreakMinutes());
        shift.setGraceMinutes(request.getGraceMinutes());
        shift.setMinimumWorkMinutes(request.getMinimumWorkMinutes());
        shift.setHalfDayMinutes(request.getHalfDayMinutes());
        if (request.getActive() != null) {
            shift.setActive(request.getActive());
        }
        return mapToResponse(shiftRepository.save(shift));
    }

    public void deleteShift(Long id) {
        shiftRepository.delete(findById(id));
    }

    private Shift findById(Long id) {
        return shiftRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Shift not found"));
    }

    public ShiftResponse mapToResponse(Shift shift) {
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

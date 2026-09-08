package com.office.brewdesk.attendance.service;

import com.office.brewdesk.attendance.dto.AttendanceRecordResponse;
import com.office.brewdesk.attendance.dto.BulkCalculationRequest;
import com.office.brewdesk.attendance.dto.BulkCalculationResponse;
import com.office.brewdesk.attendance.dto.AttendanceRecordsPageResponse;
import com.office.brewdesk.attendance.dto.AttendanceSessionResponse;
import com.office.brewdesk.attendance.entity.*;
import com.office.brewdesk.attendance.enums.AttendanceEventType;
import com.office.brewdesk.attendance.enums.AttendanceStatus;
import com.office.brewdesk.attendance.repository.AttendanceRecordSpecification;
import com.office.brewdesk.attendance.dto.BulkCalculationRequest;
import com.office.brewdesk.attendance.dto.BulkCalculationResponse;
import com.office.brewdesk.attendance.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AttendanceCalculationService {

    private final AttendanceEventRepository attendanceEventRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final EmployeeProfileRepository employeeProfileRepository;


    public AttendanceRecord calculateAttendance(
            String employeeCode,
            LocalDate attendanceDate
    ) {

        EmployeeProfile employee =
                employeeProfileRepository
                        .findByEmployeeCode(employeeCode)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Employee not found"
                                ));

        Shift shift = getEmployeeShift(employee);

        LocalDateTime shiftStart =
                calculateShiftStart(attendanceDate, shift);

        LocalDateTime shiftEnd =
                calculateShiftEnd(attendanceDate, shift);

        List<AttendanceEvent> events =
                attendanceEventRepository
                        .findByEmployeeIdAndEventTimeBetweenOrderByEventTimeAsc(
                                employee.getId(),
                                shiftStart.minusHours(4),
                                shiftEnd.plusHours(4)
                        );

        List<AttendanceEvent> punches = events.stream()
                .filter(event ->
                        event.getEventType() == AttendanceEventType.PUNCH
                )
                .toList();

        AttendanceRecord record =
                attendanceRecordRepository
                        .findByEmployeeIdAndAttendanceDate(
                                employee.getId(),
                                attendanceDate
                        )
                        .orElseGet(() ->
                                AttendanceRecord.builder()
                                        .employee(employee)
                                        .shift(shift)
                                        .attendanceDate(attendanceDate)
                                        .status(AttendanceStatus.INCOMPLETE)
                                        .build()
                        );

        if (punches.isEmpty()) {

            record.setStatus(AttendanceStatus.ABSENT);
            record.setTotalWorkMinutes(0);
            record.setLateMinutes(0);
            record.setEarlyExitMinutes(0);

            return attendanceRecordRepository.save(record);
        }

        LocalDateTime firstIn =
                punches.getFirst().getEventTime();

        record.setFirstIn(firstIn);

        if (punches.size() < 2) {

            record.setLastOut(null);
            record.setTotalWorkMinutes(0);
            record.setStatus(AttendanceStatus.INCOMPLETE);

            calculateLate(record, firstIn, shiftStart);

            return attendanceRecordRepository.save(record);
        }

        boolean incompletePunches = punches.size() % 2 != 0;

        LocalDateTime lastOut = null;

        if (!incompletePunches) {
            lastOut = punches.getLast().getEventTime();
        }

        record.setLastOut(lastOut);

        record.getSessions().clear();

        int totalMinutes = 0;

        for (int i = 0; i + 1 < punches.size(); i += 2) {

            LocalDateTime punchIn =
                    punches.get(i).getEventTime();

            LocalDateTime punchOut =
                    punches.get(i + 1).getEventTime();

            long workedMinutes =
                    Duration.between(
                            punchIn,
                            punchOut
                    ).toMinutes();

            if (workedMinutes < 0) {
                continue;
            }

            AttendanceSession session =
                    AttendanceSession.builder()
                            .attendanceRecord(record)
                            .punchIn(punchIn)
                            .punchOut(punchOut)
                            .workedMinutes((int) workedMinutes)
                            .build();

            record.getSessions().add(session);

            totalMinutes += (int) workedMinutes;
        }

        record.setTotalWorkMinutes(totalMinutes);

        calculateLate(
                record,
                firstIn,
                shiftStart
        );

        if (lastOut != null) {

            calculateEarlyExit(
                    record,
                    lastOut,
                    shiftEnd
            );

        } else {

            record.setEarlyExitMinutes(0);
        }

        if (incompletePunches) {

            record.setStatus(
                    AttendanceStatus.INCOMPLETE
            );

        } else if (totalMinutes >= shift.getMinimumWorkMinutes()) {

            record.setStatus(
                    AttendanceStatus.PRESENT
            );

        } else if (totalMinutes >= shift.getHalfDayMinutes()) {

            record.setStatus(
                    AttendanceStatus.HALF_DAY
            );

        } else {

            record.setStatus(
                    AttendanceStatus.ABSENT
            );
        }

        return attendanceRecordRepository.save(record);
    }

    private Shift getEmployeeShift(EmployeeProfile employee) {

        if (employee.getShift() == null) {

            throw new IllegalArgumentException(
                    "Employee does not have a shift assigned"
            );
        }

        return employee.getShift();
    }

    private LocalDateTime calculateShiftStart(
            LocalDate date,
            Shift shift
    ) {

        return LocalDateTime.of(
                date,
                shift.getStartTime()
        );
    }

    private LocalDateTime calculateShiftEnd(
            LocalDate date,
            Shift shift
    ) {

        LocalDate endDate = date;

        if (shift.getEndTime().isBefore(shift.getStartTime())) {
            endDate = date.plusDays(1);
        }

        return LocalDateTime.of(
                endDate,
                shift.getEndTime()
        );
    }

    private void calculateLate(
            AttendanceRecord record,
            LocalDateTime firstIn,
            LocalDateTime shiftStart
    ) {

        LocalDateTime graceEnd =
                shiftStart.plusMinutes(
                        record.getShift().getGraceMinutes()
                );

        if (firstIn.isAfter(graceEnd)) {

            record.setLateMinutes(
                    (int) Duration.between(
                            shiftStart,
                            firstIn
                    ).toMinutes()
            );

        } else {

            record.setLateMinutes(0);
        }
    }

    private void calculateEarlyExit(
            AttendanceRecord record,
            LocalDateTime lastOut,
            LocalDateTime shiftEnd
    ) {

        if (lastOut.isBefore(shiftEnd)) {

            record.setEarlyExitMinutes(
                    (int) Duration.between(
                            lastOut,
                            shiftEnd
                    ).toMinutes()
            );

        } else {

            record.setEarlyExitMinutes(0);
        }
    }

    // ── Records list ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AttendanceRecordResponse> getMonthRecords(
            String employeeCode,
            int year,
            int month
    ) {
        LocalDate firstDay = LocalDate.of(year, month, 1);
        LocalDate lastDay  = firstDay.withDayOfMonth(firstDay.lengthOfMonth());

        var spec = AttendanceRecordSpecification.withFilters(
                employeeCode, firstDay, lastDay, null
        );

        var sort = Sort.by(Sort.Direction.ASC, "attendanceDate");

        return attendanceRecordRepository
                .findAll(spec, sort)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AttendanceRecordsPageResponse getRecords(
            String employeeCode,
            LocalDate dateFrom,
            LocalDate dateTo,
            AttendanceStatus status,
            int page,
            int size
    ) {
        int clampedSize = Math.min(size, 100);

        var spec = AttendanceRecordSpecification.withFilters(
                employeeCode, dateFrom, dateTo, status
        );

        // Sort: newest date first, then employee code
        var sort = Sort.by(Sort.Direction.DESC, "attendanceDate")
                .and(Sort.by(Sort.Direction.ASC, "employee.employeeCode"));

        Page<AttendanceRecord> recordPage =
                attendanceRecordRepository.findAll(
                        spec,
                        PageRequest.of(page, clampedSize, sort)
                );

        List<AttendanceRecordResponse> content = recordPage.getContent()
                .stream()
                .map(this::mapToResponse)
                .toList();

        return AttendanceRecordsPageResponse.builder()
                .content(content)
                .pageNumber(recordPage.getNumber())
                .pageSize(recordPage.getSize())
                .totalElements(recordPage.getTotalElements())
                .totalPages(recordPage.getTotalPages())
                .first(recordPage.isFirst())
                .last(recordPage.isLast())
                .build();
    }

    public AttendanceRecordResponse mapToResponse(AttendanceRecord record) {

        return AttendanceRecordResponse.builder()
                .id(record.getId())
                .employeeId(record.getEmployee().getId())
                .employeeCode(record.getEmployee().getEmployeeCode())
                .shiftId(record.getShift().getId())
                .shiftName(record.getShift().getName())
                .attendanceDate(record.getAttendanceDate())
                .firstIn(record.getFirstIn())
                .lastOut(record.getLastOut())
                .totalWorkMinutes(record.getTotalWorkMinutes())
                .lateMinutes(record.getLateMinutes())
                .earlyExitMinutes(record.getEarlyExitMinutes())
                .status(record.getStatus())
                .sessions(
                        record.getSessions().stream()
                                .map(s -> AttendanceSessionResponse.builder()
                                        .id(s.getId())
                                        .punchIn(s.getPunchIn())
                                        .punchOut(s.getPunchOut())
                                        .workedMinutes(s.getWorkedMinutes())
                                        .build())
                                .toList()
                )
                .createdAt(record.getCreatedAt())
                .updatedAt(record.getUpdatedAt())
                .build();
    }

    // -- Bulk calculation ------------------------------------------------------

    public BulkCalculationResponse bulkCalculate(BulkCalculationRequest request) {
        java.util.List<EmployeeProfile> employees;
        if (request.getEmployeeCode() != null && !request.getEmployeeCode().isBlank()) {
            EmployeeProfile emp = employeeProfileRepository
                    .findByEmployeeCode(request.getEmployeeCode().trim())
                    .orElseThrow(() -> new IllegalArgumentException("Employee not found"));
            employees = java.util.List.of(emp);
        } else {
            employees = employeeProfileRepository.findAll()
                    .stream()
                    .filter(e -> Boolean.TRUE.equals(e.getActive()))
                    .toList();
        }
        int successCount = 0;
        int skippedCount = 0;
        int errorCount   = 0;
        java.util.List<String> errors = new java.util.ArrayList<>();
        java.time.LocalDate cursor = request.getDateFrom();
        while (!cursor.isAfter(request.getDateTo())) {
            java.time.LocalDate date = cursor;
            for (EmployeeProfile emp : employees) {
                if (emp.getShift() == null) { skippedCount++; continue; }
                try {
                    calculateAttendance(emp.getEmployeeCode(), date);
                    successCount++;
                } catch (Exception ex) {
                    errorCount++;
                    errors.add(emp.getEmployeeCode() + " / " + date + ": " + ex.getMessage());
                }
            }
            cursor = cursor.plusDays(1);
        }
        long totalDays = java.time.temporal.ChronoUnit.DAYS.between(
                request.getDateFrom(), request.getDateTo()) + 1;
        return BulkCalculationResponse.builder()
                .totalDays((int) totalDays)
                .totalEmployees(employees.size())
                .successCount(successCount)
                .skippedCount(skippedCount)
                .errorCount(errorCount)
                .errors(errors)
                .build();
    }
}

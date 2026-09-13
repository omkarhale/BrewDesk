package com.office.brewdesk.leave.controller;

import com.office.brewdesk.exception.LeaveException;
import com.office.brewdesk.leave.dto.EmployeeLeaveBalanceResponse;
import com.office.brewdesk.leave.entity.EmployeeLeaveBalance;
import com.office.brewdesk.leave.entity.LeaveType;
import com.office.brewdesk.leave.repository.EmployeeLeaveBalanceRepository;
import com.office.brewdesk.leave.service.LeaveAccrualService;
import com.office.brewdesk.leave.service.LeaveTypeService;
import com.office.brewdesk.attendance.repository.EmployeeProfileRepository;
import com.office.brewdesk.attendance.entity.EmployeeProfile;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.YearMonth;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/leave/accrual")
@RequiredArgsConstructor
public class LeaveAdminAccrualController {

    private final LeaveAccrualService accrualService;
    private final EmployeeLeaveBalanceRepository balanceRepo;
    private final LeaveTypeService leaveTypeService;
    private final EmployeeProfileRepository employeeProfileRepo;

    private static final String MGMT = "hasAnyRole('SUPER_ADMIN','ADMIN')";

    /**
     * Run monthly accrual for all active employees for the given period.
     * Format: YYYY-MM  e.g. 2026-09
     * Safe to run multiple times — idempotent.
     */
    @PostMapping("/run")
    @PreAuthorize(MGMT)
    public ResponseEntity<Map<String, String>> runAccrual(
            @RequestParam @NotBlank String period) {
        try {
            YearMonth ym = YearMonth.parse(period);
            accrualService.runMonthlyAccrual(ym);
            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Accrual completed for " + period
            ));
        } catch (java.time.format.DateTimeParseException e) {
            throw new LeaveException("Invalid period format. Use YYYY-MM (e.g. 2026-09)");
        }
    }

    /**
     * Run accrual for a range of months (e.g. from joining date up to today).
     * Useful for backfilling a new employee's PL balance.
     */
    @PostMapping("/run-range")
    @PreAuthorize(MGMT)
    public ResponseEntity<Map<String, Object>> runAccrualRange(
            @RequestParam @NotBlank String from,
            @RequestParam @NotBlank String to) {
        try {
            YearMonth start = YearMonth.parse(from);
            YearMonth end   = YearMonth.parse(to);
            if (start.isAfter(end)) {
                throw new LeaveException("'from' must be before or equal to 'to'");
            }
            int count = 0;
            YearMonth cursor = start;
            while (!cursor.isAfter(end)) {
                accrualService.runMonthlyAccrual(cursor);
                cursor = cursor.plusMonths(1);
                count++;
            }
            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "periodsProcessed", count,
                    "message", "Accrual completed for " + count + " period(s) from " + from + " to " + to
            ));
        } catch (java.time.format.DateTimeParseException e) {
            throw new LeaveException("Invalid period format. Use YYYY-MM (e.g. 2026-09)");
        }
    }

    /**
     * Manually adjust an employee's leave balance.
     * Used by HR to fix balance discrepancies or grant special allocations.
     */
    @PostMapping("/adjust")
    @PreAuthorize(MGMT)
    public ResponseEntity<EmployeeLeaveBalanceResponse> adjustBalance(
            @RequestBody AdjustBalanceRequest req) {

        EmployeeProfile emp = employeeProfileRepo.findById(req.getEmployeeId())
                .orElseThrow(() -> new LeaveException("Employee not found: " + req.getEmployeeId()));

        LeaveType lt = leaveTypeService.findById(req.getLeaveTypeId());

        EmployeeLeaveBalance balance = balanceRepo
                .findByEmployeeIdAndLeaveTypeId(emp.getId(), lt.getId())
                .orElseGet(() -> EmployeeLeaveBalance.builder()
                        .employee(emp).leaveType(lt).build());

        balance.setAdjusted(balance.getAdjusted() + req.getAmount());
        balance.recalculate();
        EmployeeLeaveBalance saved = balanceRepo.save(balance);

        return ResponseEntity.ok(toResponse(saved));
    }

    /**
     * Get all leave balances for a specific employee.
     */
    @GetMapping("/balances/{employeeId}")
    @PreAuthorize(MGMT)
    public ResponseEntity<List<EmployeeLeaveBalanceResponse>> getBalances(
            @PathVariable Long employeeId) {
        List<EmployeeLeaveBalanceResponse> balances = balanceRepo
                .findActiveBalancesForEmployee(employeeId)
                .stream().map(this::toResponse).toList();
        return ResponseEntity.ok(balances);
    }

    private EmployeeLeaveBalanceResponse toResponse(EmployeeLeaveBalance b) {
        return EmployeeLeaveBalanceResponse.builder()
                .id(b.getId())
                .leaveTypeId(b.getLeaveType().getId())
                .leaveTypeCode(b.getLeaveType().getCode())
                .leaveTypeName(b.getLeaveType().getName())
                .paid(b.getLeaveType().getPaid())
                .openingBalance(b.getOpeningBalance())
                .accrued(b.getAccrued())
                .used(b.getUsed())
                .pending(b.getPending())
                .adjusted(b.getAdjusted())
                .available(b.getAvailable())
                .build();
    }

    @Getter @Setter
    public static class AdjustBalanceRequest {
        @NotNull(message = "employeeId is required")
        private Long employeeId;

        @NotNull(message = "leaveTypeId is required")
        private Long leaveTypeId;

        @NotNull(message = "amount is required")
        @DecimalMin(value = "-100.0", message = "Adjustment cannot be less than -100")
        private Double amount;

        private String reason;
    }
}

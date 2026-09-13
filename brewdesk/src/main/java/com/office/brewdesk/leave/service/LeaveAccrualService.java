package com.office.brewdesk.leave.service;

import com.office.brewdesk.attendance.entity.EmployeeProfile;
import com.office.brewdesk.attendance.repository.EmployeeProfileRepository;
import com.office.brewdesk.leave.entity.EmployeeLeaveBalance;
import com.office.brewdesk.leave.entity.LeaveAccrualTransaction;
import com.office.brewdesk.leave.entity.LeaveType;
import com.office.brewdesk.leave.enums.AccrualFrequency;
import com.office.brewdesk.leave.repository.EmployeeLeaveBalanceRepository;
import com.office.brewdesk.leave.repository.LeaveAccrualTransactionRepository;
import com.office.brewdesk.leave.repository.LeaveTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

/**
 * Handles PL accrual: 1.25 days/month from joining date.
 * Idempotent — duplicate accruals are silently skipped.
 * Transaction-safe — each employee accrual is committed atomically.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LeaveAccrualService {

    private static final double PL_MONTHLY_ACCRUAL = 1.25;

    private final EmployeeProfileRepository employeeProfileRepository;
    private final LeaveTypeRepository leaveTypeRepository;
    private final EmployeeLeaveBalanceRepository balanceRepository;
    private final LeaveAccrualTransactionRepository accrualTxRepo;

    /**
     * Run monthly accrual for all active employees for the given period.
     * Safe to rerun — already-accrued periods are skipped.
     */
    @Transactional
    public void runMonthlyAccrual(YearMonth period) {
        List<LeaveType> accrualTypes = leaveTypeRepository.findAll().stream()
                .filter(lt -> lt.getActive() && lt.getAccrualFrequency() == AccrualFrequency.MONTHLY)
                .toList();
        if (accrualTypes.isEmpty()) {
            log.info("No active MONTHLY accrual leave types found.");
            return;
        }

        List<EmployeeProfile> employees = employeeProfileRepository.findAll().stream()
                .filter(EmployeeProfile::getActive)
                .toList();

        for (EmployeeProfile emp : employees) {
            for (LeaveType lt : accrualTypes) {
                accrueForEmployee(emp, lt, period);
            }
        }
        log.info("Monthly accrual complete for period {} — {} employees, {} leave types",
                period, employees.size(), accrualTypes.size());
    }

    /**
     * Accrue for a single employee and leave type for the given period.
     * Idempotent — returns false if already accrued.
     */
    @Transactional
    public boolean accrueForEmployee(EmployeeProfile employee, LeaveType leaveType, YearMonth period) {
        String periodKey = LeaveAccrualTransaction.periodKey(period);

        // Idempotency guard
        if (accrualTxRepo.existsByEmployeeIdAndLeaveTypeIdAndAccrualPeriod(
                employee.getId(), leaveType.getId(), periodKey)) {
            log.debug("Accrual already exists for emp={} type={} period={} — skipping",
                    employee.getId(), leaveType.getId(), periodKey);
            return false;
        }

        // Employee must have joined before or during this period
        if (employee.getJoiningDate() == null) {
            log.warn("Employee {} has no joining date — skipping accrual", employee.getId());
            return false;
        }
        YearMonth joiningPeriod = YearMonth.from(employee.getJoiningDate());
        if (joiningPeriod.isAfter(period)) {
            log.debug("Employee {} joined after period {} — skipping", employee.getId(), period);
            return false;
        }

        double amount = calculateAccrualAmount(employee.getJoiningDate(), leaveType, period);
        if (amount <= 0) return false;

        // Record transaction
        LeaveAccrualTransaction tx = LeaveAccrualTransaction.builder()
                .employee(employee)
                .leaveType(leaveType)
                .accrualPeriod(periodKey)
                .amount(amount)
                .reference("Monthly accrual for " + periodKey)
                .build();
        accrualTxRepo.save(tx);

        // Update balance
        EmployeeLeaveBalance balance = balanceRepository
                .findByEmployeeIdAndLeaveTypeId(employee.getId(), leaveType.getId())
                .orElseGet(() -> EmployeeLeaveBalance.builder()
                        .employee(employee).leaveType(leaveType).build());
        balance.setAccrued(balance.getAccrued() + amount);
        balance.recalculate();
        balanceRepository.save(balance);

        log.debug("Accrued {} days for emp={} type={} period={}", amount, employee.getId(), leaveType.getId(), periodKey);
        return true;
    }

    /**
     * Calculate accrual amount for a given period.
     * First month is prorated based on joining day within the month.
     */
    double calculateAccrualAmount(LocalDate joiningDate, LeaveType leaveType, YearMonth period) {
        double base = leaveType.getAccrualAmount() > 0 ? leaveType.getAccrualAmount() : PL_MONTHLY_ACCRUAL;
        YearMonth joiningPeriod = YearMonth.from(joiningDate);

        if (!joiningPeriod.equals(period)) {
            return base; // full month
        }

        // First month: prorate by remaining days in month
        int daysInMonth = period.lengthOfMonth();
        int joiningDay = joiningDate.getDayOfMonth();
        int remainingDays = daysInMonth - joiningDay + 1;
        double prorated = base * ((double) remainingDays / daysInMonth);
        return Math.round(prorated * 4) / 4.0; // round to nearest 0.25
    }
}

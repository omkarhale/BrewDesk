package com.office.brewdesk.leave.repository;

import com.office.brewdesk.leave.entity.LeaveAccrualTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LeaveAccrualTransactionRepository extends JpaRepository<LeaveAccrualTransaction, Long> {

    boolean existsByEmployeeIdAndLeaveTypeIdAndAccrualPeriod(
            Long employeeId, Long leaveTypeId, String accrualPeriod);

    Optional<LeaveAccrualTransaction> findByEmployeeIdAndLeaveTypeIdAndAccrualPeriod(
            Long employeeId, Long leaveTypeId, String accrualPeriod);
}

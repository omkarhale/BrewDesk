package com.office.brewdesk.leave.repository;

import com.office.brewdesk.leave.entity.EmployeeLeaveBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EmployeeLeaveBalanceRepository extends JpaRepository<EmployeeLeaveBalance, Long> {

    Optional<EmployeeLeaveBalance> findByEmployeeIdAndLeaveTypeId(Long employeeId, Long leaveTypeId);

    List<EmployeeLeaveBalance> findAllByEmployeeId(Long employeeId);

    @Query("SELECT elb FROM EmployeeLeaveBalance elb " +
           "JOIN FETCH elb.leaveType " +
           "WHERE elb.employee.id = :employeeId AND elb.leaveType.active = true")
    List<EmployeeLeaveBalance> findActiveBalancesForEmployee(@Param("employeeId") Long employeeId);
}

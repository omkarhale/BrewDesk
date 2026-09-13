package com.office.brewdesk.leave.repository;

import com.office.brewdesk.leave.entity.LeavePolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LeavePolicyRepository extends JpaRepository<LeavePolicy, Long> {

    List<LeavePolicy> findAllByLeaveTypeId(Long leaveTypeId);

    List<LeavePolicy> findAllByActiveTrue();

    @Query("SELECT p FROM LeavePolicy p WHERE p.leaveType.id = :typeId AND p.active = true")
    List<LeavePolicy> findActiveByLeaveTypeId(@Param("typeId") Long typeId);

    @Query("SELECT p FROM LeavePolicy p " +
           "JOIN p.departments pd " +
           "WHERE pd.department.id = :departmentId AND p.active = true AND p.leaveType.active = true")
    List<LeavePolicy> findActiveByDepartmentId(@Param("departmentId") Long departmentId);
}

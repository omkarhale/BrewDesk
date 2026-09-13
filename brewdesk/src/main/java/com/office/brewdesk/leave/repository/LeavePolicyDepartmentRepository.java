package com.office.brewdesk.leave.repository;

import com.office.brewdesk.leave.entity.LeavePolicyDepartment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LeavePolicyDepartmentRepository extends JpaRepository<LeavePolicyDepartment, Long> {

    boolean existsByLeavePolicyIdAndDepartmentId(Long policyId, Long departmentId);

    void deleteByLeavePolicyIdAndDepartmentId(Long policyId, Long departmentId);

    List<LeavePolicyDepartment> findAllByLeavePolicyId(Long policyId);
}

package com.office.brewdesk.leave.service;

import com.office.brewdesk.attendance.entity.Department;
import com.office.brewdesk.attendance.repository.DepartmentRepository;
import com.office.brewdesk.exception.LeaveException;
import com.office.brewdesk.leave.dto.*;
import com.office.brewdesk.leave.entity.LeavePolicy;
import com.office.brewdesk.leave.entity.LeavePolicyDepartment;
import com.office.brewdesk.leave.entity.LeaveType;
import com.office.brewdesk.leave.repository.LeavePolicyDepartmentRepository;
import com.office.brewdesk.leave.repository.LeavePolicyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LeavePolicyService {

    private final LeavePolicyRepository policyRepo;
    private final LeavePolicyDepartmentRepository policyDeptRepo;
    private final LeaveTypeService leaveTypeService;
    private final DepartmentRepository departmentRepository;

    public List<LeavePolicyResponse> getAll() {
        return policyRepo.findAll().stream().map(this::toResponse).toList();
    }

    public LeavePolicyResponse getById(Long id) {
        return toResponse(findById(id));
    }

    @Transactional
    public LeavePolicyResponse create(CreateLeavePolicyRequest req) {
        LeaveType lt = leaveTypeService.findById(req.getLeaveTypeId());
        LeavePolicy policy = LeavePolicy.builder()
                .leaveType(lt)
                .policyName(req.getPolicyName())
                .accrualStartRule(req.getAccrualStartRule())
                .minimumNoticeDays(req.getMinimumNoticeDays())
                .maximumConsecutiveDays(req.getMaximumConsecutiveDays())
                .backdatedAllowed(req.getBackdatedAllowed())
                .cancellationAllowed(req.getCancellationAllowed())
                .approvalRequired(req.getApprovalRequired())
                .effectiveFrom(req.getEffectiveFrom())
                .effectiveTo(req.getEffectiveTo())
                .active(true)
                .build();
        LeavePolicy saved = policyRepo.save(policy);

        if (req.getDepartmentIds() != null) {
            for (Long deptId : req.getDepartmentIds()) {
                assignDepartmentInternal(saved, deptId);
            }
        }
        return toResponse(policyRepo.findById(saved.getId()).orElseThrow());
    }

    @Transactional
    public LeavePolicyResponse update(Long id, CreateLeavePolicyRequest req) {
        LeavePolicy policy = findById(id);
        LeaveType lt = leaveTypeService.findById(req.getLeaveTypeId());
        policy.setLeaveType(lt);
        policy.setPolicyName(req.getPolicyName());
        policy.setAccrualStartRule(req.getAccrualStartRule());
        policy.setMinimumNoticeDays(req.getMinimumNoticeDays());
        policy.setMaximumConsecutiveDays(req.getMaximumConsecutiveDays());
        policy.setBackdatedAllowed(req.getBackdatedAllowed());
        policy.setCancellationAllowed(req.getCancellationAllowed());
        policy.setApprovalRequired(req.getApprovalRequired());
        policy.setEffectiveFrom(req.getEffectiveFrom());
        policy.setEffectiveTo(req.getEffectiveTo());
        return toResponse(policyRepo.save(policy));
    }

    @Transactional
    public LeavePolicyResponse assignDepartment(Long policyId, Long departmentId) {
        LeavePolicy policy = findById(policyId);
        assignDepartmentInternal(policy, departmentId);
        return toResponse(policyRepo.findById(policyId).orElseThrow());
    }

    @Transactional
    public LeavePolicyResponse removeDepartment(Long policyId, Long departmentId) {
        if (!policyDeptRepo.existsByLeavePolicyIdAndDepartmentId(policyId, departmentId)) {
            throw new LeaveException("Department not assigned to this policy");
        }
        policyDeptRepo.deleteByLeavePolicyIdAndDepartmentId(policyId, departmentId);
        return toResponse(policyRepo.findById(policyId).orElseThrow());
    }

    @Transactional
    public LeavePolicyResponse setActive(Long id, boolean active) {
        LeavePolicy policy = findById(id);
        policy.setActive(active);
        return toResponse(policyRepo.save(policy));
    }

    private void assignDepartmentInternal(LeavePolicy policy, Long departmentId) {
        if (policyDeptRepo.existsByLeavePolicyIdAndDepartmentId(policy.getId(), departmentId)) {
            return; // already assigned — idempotent
        }
        Department dept = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new LeaveException("Department not found: " + departmentId));
        LeavePolicyDepartment lpd = LeavePolicyDepartment.builder()
                .leavePolicy(policy)
                .department(dept)
                .build();
        policyDeptRepo.save(lpd);
    }

    public LeavePolicy findById(Long id) {
        return policyRepo.findById(id)
                .orElseThrow(() -> new LeaveException("Leave policy not found: " + id));
    }

    public LeavePolicyResponse toResponse(LeavePolicy p) {
        List<DepartmentAssignmentResponse> depts = policyDeptRepo.findAllByLeavePolicyId(p.getId())
                .stream().map(lpd -> DepartmentAssignmentResponse.builder()
                        .id(lpd.getId())
                        .departmentId(lpd.getDepartment().getId())
                        .departmentName(lpd.getDepartment().getName())
                        .departmentCode(lpd.getDepartment().getCode())
                        .build())
                .toList();
        return LeavePolicyResponse.builder()
                .id(p.getId())
                .leaveTypeId(p.getLeaveType().getId())
                .leaveTypeName(p.getLeaveType().getName())
                .leaveTypeCode(p.getLeaveType().getCode())
                .policyName(p.getPolicyName())
                .accrualStartRule(p.getAccrualStartRule().name())
                .minimumNoticeDays(p.getMinimumNoticeDays())
                .maximumConsecutiveDays(p.getMaximumConsecutiveDays())
                .backdatedAllowed(p.getBackdatedAllowed())
                .cancellationAllowed(p.getCancellationAllowed())
                .approvalRequired(p.getApprovalRequired())
                .effectiveFrom(p.getEffectiveFrom())
                .effectiveTo(p.getEffectiveTo())
                .active(p.getActive())
                .departments(depts)
                .build();
    }
}

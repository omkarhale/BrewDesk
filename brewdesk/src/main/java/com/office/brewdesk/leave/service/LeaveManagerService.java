package com.office.brewdesk.leave.service;

import com.office.brewdesk.attendance.entity.EmployeeProfile;
import com.office.brewdesk.attendance.repository.EmployeeProfileRepository;
import com.office.brewdesk.entity.User;
import com.office.brewdesk.exception.LeaveException;
import com.office.brewdesk.leave.dto.LeavePageResponse;
import com.office.brewdesk.leave.dto.LeaveRequestResponse;
import com.office.brewdesk.leave.dto.ReviewLeaveRequest;
import com.office.brewdesk.leave.entity.EmployeeLeaveBalance;
import com.office.brewdesk.leave.entity.LeaveApprovalHistory;
import com.office.brewdesk.leave.entity.LeaveRequest;
import com.office.brewdesk.leave.enums.LeaveApprovalAction;
import com.office.brewdesk.leave.enums.LeaveStatus;
import com.office.brewdesk.leave.repository.EmployeeLeaveBalanceRepository;
import com.office.brewdesk.leave.repository.LeaveApprovalHistoryRepository;
import com.office.brewdesk.leave.repository.LeaveRequestRepository;
import com.office.brewdesk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LeaveManagerService {

    private final LeaveRequestRepository requestRepo;
    private final EmployeeLeaveBalanceRepository balanceRepo;
    private final LeaveApprovalHistoryRepository historyRepo;
    private final EmployeeProfileRepository employeeProfileRepo;
    private final UserRepository userRepository;
    private final LeaveRequestService leaveRequestService;

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new LeaveException("User not found"));
    }

    public List<LeaveRequestResponse> getPendingRequests() {
        User manager = currentUser();
        return requestRepo.findPendingByManagerId(manager.getId())
                .stream().map(leaveRequestService::toResponse).toList();
    }

    public LeavePageResponse getAllTeamRequests(int page, int size) {
        User manager = currentUser();
        Page<LeaveRequest> pg = requestRepo.findAllByManagerId(manager.getId(), PageRequest.of(page, size));
        return LeavePageResponse.builder()
                .content(pg.getContent().stream().map(leaveRequestService::toResponse).toList())
                .pageNumber(pg.getNumber()).pageSize(pg.getSize())
                .totalElements(pg.getTotalElements()).totalPages(pg.getTotalPages())
                .first(pg.isFirst()).last(pg.isLast()).build();
    }

    public LeaveRequestResponse getRequestDetail(Long requestId) {
        User manager = currentUser();
        LeaveRequest req = findAndValidateManagerAccess(requestId, manager);
        return leaveRequestService.toResponse(req);
    }

    /**
     * Approve a leave request. Transactional — balance update and history write
     * are committed atomically. Rolls back if any step fails.
     */
    @Transactional
    public LeaveRequestResponse approve(Long requestId, ReviewLeaveRequest review) {
        User manager = currentUser();
        LeaveRequest req = findAndValidateManagerAccess(requestId, manager);

        if (req.getStatus() != LeaveStatus.PENDING) {
            throw new LeaveException("Only PENDING requests can be approved");
        }

        // Update request status
        req.setStatus(LeaveStatus.APPROVED);
        req.setApprovedBy(manager);
        req.setApprovedAt(LocalDateTime.now());
        req.setRemarks(review != null ? review.getRemarks() : null);

        // Deduct balance
        EmployeeLeaveBalance balance = balanceRepo
                .findByEmployeeIdAndLeaveTypeId(req.getEmployee().getId(), req.getLeaveType().getId())
                .orElseGet(() -> EmployeeLeaveBalance.builder()
                        .employee(req.getEmployee()).leaveType(req.getLeaveType()).build());

        double deduction = req.getTotalDays();
        if (req.getLeaveType().getPaid() && balance.getAvailable() < deduction) {
            throw new LeaveException(String.format(
                    "Insufficient balance at approval time. Available: %.1f, Requested: %.1f",
                    balance.getAvailable(), deduction));
        }
        balance.setUsed(balance.getUsed() + deduction);
        balance.recalculate();
        balanceRepo.save(balance);

        // Audit history
        historyRepo.save(LeaveApprovalHistory.builder()
                .leaveRequest(req)
                .action(LeaveApprovalAction.APPROVED)
                .performedBy(manager)
                .remarks(review != null ? review.getRemarks() : null)
                .build());

        return leaveRequestService.toResponse(requestRepo.save(req));
    }

    /**
     * Reject a leave request. Transactional.
     */
    @Transactional
    public LeaveRequestResponse reject(Long requestId, ReviewLeaveRequest review) {
        User manager = currentUser();
        LeaveRequest req = findAndValidateManagerAccess(requestId, manager);

        if (req.getStatus() != LeaveStatus.PENDING) {
            throw new LeaveException("Only PENDING requests can be rejected");
        }

        req.setStatus(LeaveStatus.REJECTED);
        req.setRejectedBy(manager);
        req.setRejectedAt(LocalDateTime.now());
        req.setRemarks(review != null ? review.getRemarks() : null);

        historyRepo.save(LeaveApprovalHistory.builder()
                .leaveRequest(req)
                .action(LeaveApprovalAction.REJECTED)
                .performedBy(manager)
                .remarks(review != null ? review.getRemarks() : null)
                .build());

        return leaveRequestService.toResponse(requestRepo.save(req));
    }

    /**
     * Validate that the authenticated user IS the reporting manager for the request's employee.
     * Backend enforcement — never trust IDs from the frontend.
     */
    private LeaveRequest findAndValidateManagerAccess(Long requestId, User manager) {
        LeaveRequest req = requestRepo.findById(requestId)
                .orElseThrow(() -> new LeaveException("Leave request not found"));

        User reportingManager = req.getEmployee().getManager();
        if (reportingManager == null || !reportingManager.getId().equals(manager.getId())) {
            throw new LeaveException("You are not the reporting manager for this employee");
        }
        return req;
    }
}

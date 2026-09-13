package com.office.brewdesk.leave.service;

import com.office.brewdesk.attendance.entity.EmployeeProfile;
import com.office.brewdesk.attendance.repository.EmployeeProfileRepository;
import com.office.brewdesk.entity.User;
import com.office.brewdesk.enums.Gender;
import com.office.brewdesk.exception.LeaveException;
import com.office.brewdesk.leave.dto.*;
import com.office.brewdesk.leave.entity.*;
import com.office.brewdesk.leave.enums.DayDuration;
import com.office.brewdesk.leave.enums.GenderEligibility;
import com.office.brewdesk.leave.enums.LeaveApprovalAction;
import com.office.brewdesk.leave.enums.LeaveStatus;
import com.office.brewdesk.leave.repository.*;
import com.office.brewdesk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LeaveRequestService {

    private final LeaveRequestRepository requestRepo;
    private final EmployeeLeaveBalanceRepository balanceRepo;
    private final LeaveApprovalHistoryRepository historyRepo;
    private final LeaveTypeRepository leaveTypeRepo;
    private final EmployeeProfileRepository employeeProfileRepo;
    private final UserRepository userRepository;

    /** Get the authenticated user's email from JWT. */
    private String currentEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    /** Get EmployeeProfile for the authenticated user. */
    private EmployeeProfile currentEmployee() {
        String email = currentEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new LeaveException("User not found"));
        return employeeProfileRepo.findByUserId(user.getId())
                .orElseThrow(() -> new LeaveException("Employee profile not found"));
    }

    public List<EmployeeLeaveBalanceResponse> getMyBalances() {
        EmployeeProfile emp = currentEmployee();
        return balanceRepo.findActiveBalancesForEmployee(emp.getId())
                .stream().map(this::toBalanceResponse).toList();
    }

    public List<LeaveTypeResponse> getEligibleLeaveTypes() {
        EmployeeProfile emp = currentEmployee();
        Gender gender = emp.getUser().getGender();
        GenderEligibility ge = gender != null
                ? GenderEligibility.valueOf(gender.name())
                : GenderEligibility.OTHER;

        Long deptId = emp.getDepartment() != null ? emp.getDepartment().getId() : null;
        List<LeaveType> types = deptId != null
                ? leaveTypeRepo.findEligibleForDepartmentAndGender(deptId, ge)
                : leaveTypeRepo.findEligibleForGender(ge);

        return types.stream().map(lt -> LeaveTypeResponse.builder()
                .id(lt.getId()).code(lt.getCode()).name(lt.getName())
                .description(lt.getDescription()).paid(lt.getPaid())
                .genderEligibility(lt.getGenderEligibility().name())
                .accrualFrequency(lt.getAccrualFrequency().name())
                .accrualAmount(lt.getAccrualAmount()).yearlyAllocation(lt.getYearlyAllocation())
                .halfDayAllowed(lt.getHalfDayAllowed()).carryForwardEnabled(lt.getCarryForwardEnabled())
                .carryForwardLimit(lt.getCarryForwardLimit()).documentRequired(lt.getDocumentRequired())
                .active(lt.getActive()).build()).toList();
    }

    @Transactional
    public LeaveRequestResponse applyLeave(ApplyLeaveRequest req) {
        EmployeeProfile emp = currentEmployee();

        // Validate dates
        if (req.getStartDate().isAfter(req.getEndDate())) {
            throw new LeaveException("Start date must be on or before end date");
        }

        // Validate leave type exists and is active
        LeaveType lt = leaveTypeRepo.findById(req.getLeaveTypeId())
                .orElseThrow(() -> new LeaveException("Leave type not found"));
        if (!lt.getActive()) throw new LeaveException("This leave type is not active");

        // Validate gender eligibility (backend enforcement)
        validateGenderEligibility(emp, lt);

        // Validate department eligibility
        validateDepartmentEligibility(emp, lt);

        // Calculate working days
        DayDuration duration = req.getDayDuration() != null ? req.getDayDuration() : DayDuration.FULL_DAY;
        double totalDays = calculateDays(req.getStartDate(), req.getEndDate(), duration);
        if (totalDays <= 0) throw new LeaveException("Leave duration must be at least 0.5 days");

        // Half-day check
        if (duration != DayDuration.FULL_DAY && !lt.getHalfDayAllowed()) {
            throw new LeaveException("Half-day leave is not allowed for " + lt.getName());
        }

        // Overlap check
        List<LeaveRequest> overlapping = requestRepo.findOverlapping(
                emp.getId(), req.getStartDate(), req.getEndDate(), null);
        if (!overlapping.isEmpty()) {
            throw new LeaveException("You already have a leave request overlapping this date range");
        }

        // Balance check
        EmployeeLeaveBalance balance = balanceRepo
                .findByEmployeeIdAndLeaveTypeId(emp.getId(), lt.getId())
                .orElseGet(() -> EmployeeLeaveBalance.builder().employee(emp).leaveType(lt).build());
        if (lt.getPaid() && balance.getAvailable() < totalDays) {
            throw new LeaveException(String.format(
                    "Insufficient %s balance. Available: %.1f, Requested: %.1f",
                    lt.getName(), balance.getAvailable(), totalDays));
        }

        // Create request
        LeaveRequest request = LeaveRequest.builder()
                .employee(emp).leaveType(lt)
                .startDate(req.getStartDate()).endDate(req.getEndDate())
                .totalDays(totalDays).dayDuration(duration)
                .reason(req.getReason()).status(LeaveStatus.PENDING)
                .build();
        LeaveRequest saved = requestRepo.save(request);

        // Audit history
        historyRepo.save(LeaveApprovalHistory.builder()
                .leaveRequest(saved).action(LeaveApprovalAction.SUBMITTED)
                .performedBy(emp.getUser())
                .remarks("Leave applied by employee").build());

        return toResponse(saved);
    }

    @Transactional
    public LeaveRequestResponse cancelLeave(Long requestId) {
        EmployeeProfile emp = currentEmployee();
        LeaveRequest req = requestRepo.findById(requestId)
                .orElseThrow(() -> new LeaveException("Leave request not found"));

        if (!req.getEmployee().getId().equals(emp.getId())) {
            throw new LeaveException("You can only cancel your own leave requests");
        }
        if (req.getStatus() != LeaveStatus.PENDING) {
            throw new LeaveException("Only PENDING requests can be cancelled");
        }

        req.setStatus(LeaveStatus.CANCELLED);
        historyRepo.save(LeaveApprovalHistory.builder()
                .leaveRequest(req).action(LeaveApprovalAction.CANCELLED)
                .performedBy(emp.getUser()).remarks("Cancelled by employee").build());
        return toResponse(requestRepo.save(req));
    }

    public LeavePageResponse getMyRequests(int page, int size) {
        EmployeeProfile emp = currentEmployee();
        Page<LeaveRequest> pg = requestRepo.findAllByEmployeeIdOrderByCreatedAtDesc(
                emp.getId(), PageRequest.of(page, size));
        return LeavePageResponse.builder()
                .content(pg.getContent().stream().map(this::toResponse).toList())
                .pageNumber(pg.getNumber()).pageSize(pg.getSize())
                .totalElements(pg.getTotalElements()).totalPages(pg.getTotalPages())
                .first(pg.isFirst()).last(pg.isLast()).build();
    }

    public LeaveRequestResponse getMyRequestById(Long id) {
        EmployeeProfile emp = currentEmployee();
        LeaveRequest req = requestRepo.findById(id)
                .orElseThrow(() -> new LeaveException("Leave request not found"));
        if (!req.getEmployee().getId().equals(emp.getId())) {
            throw new LeaveException("Access denied");
        }
        return toResponse(req);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private void validateGenderEligibility(EmployeeProfile emp, LeaveType lt) {
        if (lt.getGenderEligibility() == GenderEligibility.ALL) return;
        Gender gender = emp.getUser().getGender();
        if (gender == null || !lt.getGenderEligibility().name().equals(gender.name())) {
            throw new LeaveException("You are not eligible for " + lt.getName());
        }
    }

    private void validateDepartmentEligibility(EmployeeProfile emp, LeaveType lt) {
        if (emp.getDepartment() == null) return; // no department = no restriction
        List<LeaveType> eligible = leaveTypeRepo.findEligibleForDepartmentAndGender(
                emp.getDepartment().getId(),
                emp.getUser().getGender() != null
                        ? GenderEligibility.valueOf(emp.getUser().getGender().name())
                        : GenderEligibility.OTHER);
        boolean isAssigned = eligible.stream().anyMatch(e -> e.getId().equals(lt.getId()));
        if (!isAssigned) {
            throw new LeaveException(lt.getName() + " is not assigned to your department");
        }
    }

    double calculateDays(LocalDate start, LocalDate end, DayDuration duration) {
        if (duration == DayDuration.FIRST_HALF || duration == DayDuration.SECOND_HALF) {
            return 0.5;
        }
        long days = start.datesUntil(end.plusDays(1))
                .filter(d -> d.getDayOfWeek() != DayOfWeek.SATURDAY
                        && d.getDayOfWeek() != DayOfWeek.SUNDAY)
                .count();
        return (double) days;
    }

    EmployeeLeaveBalanceResponse toBalanceResponse(EmployeeLeaveBalance b) {
        return EmployeeLeaveBalanceResponse.builder()
                .id(b.getId()).leaveTypeId(b.getLeaveType().getId())
                .leaveTypeCode(b.getLeaveType().getCode()).leaveTypeName(b.getLeaveType().getName())
                .paid(b.getLeaveType().getPaid()).openingBalance(b.getOpeningBalance())
                .accrued(b.getAccrued()).used(b.getUsed()).pending(b.getPending())
                .adjusted(b.getAdjusted()).available(b.getAvailable()).build();
    }

    LeaveRequestResponse toResponse(LeaveRequest r) {
        List<LeaveApprovalHistoryResponse> history = historyRepo
                .findAllByLeaveRequestIdOrderByCreatedAtAsc(r.getId())
                .stream().map(h -> LeaveApprovalHistoryResponse.builder()
                        .id(h.getId()).action(h.getAction().name())
                        .performedBy(h.getPerformedBy() != null ? h.getPerformedBy().getName() : null)
                        .remarks(h.getRemarks()).createdAt(h.getCreatedAt()).build())
                .toList();
        return LeaveRequestResponse.builder()
                .id(r.getId())
                .employeeId(r.getEmployee().getId())
                .employeeName(r.getEmployee().getUser().getName())
                .employeeCode(r.getEmployee().getEmployeeCode())
                .leaveTypeId(r.getLeaveType().getId())
                .leaveTypeName(r.getLeaveType().getName())
                .leaveTypeCode(r.getLeaveType().getCode())
                .startDate(r.getStartDate()).endDate(r.getEndDate())
                .totalDays(r.getTotalDays()).status(r.getStatus().name())
                .dayDuration(r.getDayDuration() != null ? r.getDayDuration().name() : null)
                .reason(r.getReason()).remarks(r.getRemarks())
                .approvedBy(r.getApprovedBy() != null ? r.getApprovedBy().getName() : null)
                .approvedAt(r.getApprovedAt())
                .rejectedBy(r.getRejectedBy() != null ? r.getRejectedBy().getName() : null)
                .rejectedAt(r.getRejectedAt())
                .createdAt(r.getCreatedAt()).history(history).build();
    }
}

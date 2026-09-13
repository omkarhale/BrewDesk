package com.office.brewdesk.leave.service;

import com.office.brewdesk.exception.LeaveException;
import com.office.brewdesk.leave.dto.CreateLeaveTypeRequest;
import com.office.brewdesk.leave.dto.LeaveTypeResponse;
import com.office.brewdesk.leave.entity.LeaveType;
import com.office.brewdesk.leave.repository.LeaveTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LeaveTypeService {

    private final LeaveTypeRepository leaveTypeRepository;

    public List<LeaveTypeResponse> getAllLeaveTypes() {
        return leaveTypeRepository.findAll().stream().map(this::toResponse).toList();
    }

    public List<LeaveTypeResponse> getActiveLeaveTypes() {
        return leaveTypeRepository.findAllByActiveTrue().stream().map(this::toResponse).toList();
    }

    @Transactional
    public LeaveTypeResponse create(CreateLeaveTypeRequest req) {
        if (leaveTypeRepository.existsByCodeIgnoreCase(req.getCode())) {
            throw new LeaveException("Leave type with code '" + req.getCode() + "' already exists");
        }
        LeaveType lt = LeaveType.builder()
                .code(req.getCode().toUpperCase())
                .name(req.getName())
                .description(req.getDescription())
                .paid(req.getPaid())
                .genderEligibility(req.getGenderEligibility())
                .accrualFrequency(req.getAccrualFrequency())
                .accrualAmount(req.getAccrualAmount() != null ? req.getAccrualAmount() : 0.0)
                .yearlyAllocation(req.getYearlyAllocation() != null ? req.getYearlyAllocation() : 0.0)
                .halfDayAllowed(req.getHalfDayAllowed())
                .carryForwardEnabled(req.getCarryForwardEnabled())
                .carryForwardLimit(req.getCarryForwardLimit() != null ? req.getCarryForwardLimit() : 0.0)
                .documentRequired(req.getDocumentRequired())
                .active(true)
                .build();
        return toResponse(leaveTypeRepository.save(lt));
    }

    @Transactional
    public LeaveTypeResponse update(Long id, CreateLeaveTypeRequest req) {
        LeaveType lt = findById(id);
        if (leaveTypeRepository.existsByCodeIgnoreCaseAndIdNot(req.getCode(), id)) {
            throw new LeaveException("Leave type with code '" + req.getCode() + "' already exists");
        }
        lt.setCode(req.getCode().toUpperCase());
        lt.setName(req.getName());
        lt.setDescription(req.getDescription());
        lt.setPaid(req.getPaid());
        lt.setGenderEligibility(req.getGenderEligibility());
        lt.setAccrualFrequency(req.getAccrualFrequency());
        lt.setAccrualAmount(req.getAccrualAmount() != null ? req.getAccrualAmount() : 0.0);
        lt.setYearlyAllocation(req.getYearlyAllocation() != null ? req.getYearlyAllocation() : 0.0);
        lt.setHalfDayAllowed(req.getHalfDayAllowed());
        lt.setCarryForwardEnabled(req.getCarryForwardEnabled());
        lt.setCarryForwardLimit(req.getCarryForwardLimit() != null ? req.getCarryForwardLimit() : 0.0);
        lt.setDocumentRequired(req.getDocumentRequired());
        return toResponse(leaveTypeRepository.save(lt));
    }

    @Transactional
    public LeaveTypeResponse setActive(Long id, boolean active) {
        LeaveType lt = findById(id);
        lt.setActive(active);
        return toResponse(leaveTypeRepository.save(lt));
    }

    public LeaveType findById(Long id) {
        return leaveTypeRepository.findById(id)
                .orElseThrow(() -> new LeaveException("Leave type not found: " + id));
    }

    public LeaveTypeResponse toResponse(LeaveType lt) {
        return LeaveTypeResponse.builder()
                .id(lt.getId())
                .code(lt.getCode())
                .name(lt.getName())
                .description(lt.getDescription())
                .paid(lt.getPaid())
                .genderEligibility(lt.getGenderEligibility().name())
                .accrualFrequency(lt.getAccrualFrequency().name())
                .accrualAmount(lt.getAccrualAmount())
                .yearlyAllocation(lt.getYearlyAllocation())
                .halfDayAllowed(lt.getHalfDayAllowed())
                .carryForwardEnabled(lt.getCarryForwardEnabled())
                .carryForwardLimit(lt.getCarryForwardLimit())
                .documentRequired(lt.getDocumentRequired())
                .active(lt.getActive())
                .build();
    }
}

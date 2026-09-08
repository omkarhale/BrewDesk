package com.office.brewdesk.attendance.service;

import com.office.brewdesk.attendance.dto.CreateEmployeeRequest;
import com.office.brewdesk.attendance.dto.EmployeeResponse;
import com.office.brewdesk.attendance.dto.UpdateEmployeeRequest;
import com.office.brewdesk.attendance.entity.Department;
import com.office.brewdesk.attendance.entity.EmployeeProfile;
import com.office.brewdesk.attendance.entity.Shift;
import com.office.brewdesk.attendance.repository.DepartmentRepository;
import com.office.brewdesk.attendance.repository.EmployeeProfileRepository;
import com.office.brewdesk.attendance.repository.ShiftRepository;
import com.office.brewdesk.entity.User;
import com.office.brewdesk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class EmployeeProfileService {

    private final EmployeeProfileRepository employeeProfileRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final ShiftRepository shiftRepository;

    public EmployeeResponse createEmployee(CreateEmployeeRequest request) {
        if (employeeProfileRepository.existsByEmployeeCode(request.getEmployeeCode().trim())) {
            throw new IllegalArgumentException("Employee code already exists");
        }
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (employeeProfileRepository.existsByUser(user)) {
            throw new IllegalArgumentException("Employee profile already exists for this user");
        }
        Shift shift = null;
        if (request.getShiftId() != null) {
            shift = shiftRepository.findById(request.getShiftId())
                    .orElseThrow(() -> new IllegalArgumentException("Shift not found"));
        }
        Department department = null;
        if (request.getDepartmentId() != null) {
            department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new IllegalArgumentException("Department not found"));
        }
        User manager = null;
        if (request.getManagerId() != null) {
            manager = userRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new IllegalArgumentException("Manager not found"));
        }
        EmployeeProfile employee = EmployeeProfile.builder()
                .user(user)
                .employeeCode(request.getEmployeeCode().trim())
                .department(department)
                .shift(shift)
                .designation(request.getDesignation())
                .manager(manager)
                .joiningDate(request.getJoiningDate())
                .active(true)
                .build();
        return mapToResponse(employeeProfileRepository.save(employee));
    }

    @Transactional(readOnly = true)
    public List<EmployeeResponse> getAllEmployees() {
        return employeeProfileRepository.findAll().stream().map(this::mapToResponse).toList();
    }

    @Transactional(readOnly = true)
    public EmployeeResponse getEmployee(Long id) {
        return mapToResponse(findById(id));
    }

    public EmployeeResponse updateEmployee(Long id, UpdateEmployeeRequest request) {
        EmployeeProfile employee = findById(id);
        if (request.getShiftId() != null) {
            employee.setShift(shiftRepository.findById(request.getShiftId())
                    .orElseThrow(() -> new IllegalArgumentException("Shift not found")));
        } else {
            employee.setShift(null);
        }
        if (request.getDepartmentId() != null) {
            employee.setDepartment(departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new IllegalArgumentException("Department not found")));
        } else {
            employee.setDepartment(null);
        }
        if (request.getManagerId() != null) {
            employee.setManager(userRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new IllegalArgumentException("Manager not found")));
        } else {
            employee.setManager(null);
        }
        employee.setDesignation(request.getDesignation());
        employee.setJoiningDate(request.getJoiningDate());
        if (request.getActive() != null) {
            employee.setActive(request.getActive());
        }
        return mapToResponse(employeeProfileRepository.save(employee));
    }

    public EmployeeResponse updateEmployeeShift(Long employeeId, Long shiftId) {
        EmployeeProfile employee = findById(employeeId);
        Shift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new IllegalArgumentException("Shift not found"));
        employee.setShift(shift);
        return mapToResponse(employeeProfileRepository.save(employee));
    }

    private EmployeeProfile findById(Long id) {
        return employeeProfileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));
    }

    public EmployeeResponse mapToResponse(EmployeeProfile employee) {
        return EmployeeResponse.builder()
                .id(employee.getId())
                .userId(employee.getUser().getId())
                .employeeCode(employee.getEmployeeCode())
                .departmentId(employee.getDepartment() != null ? employee.getDepartment().getId() : null)
                .departmentName(employee.getDepartment() != null ? employee.getDepartment().getName() : null)
                .shiftId(employee.getShift() != null ? employee.getShift().getId() : null)
                .shiftName(employee.getShift() != null ? employee.getShift().getName() : null)
                .designation(employee.getDesignation())
                .managerId(employee.getManager() != null ? employee.getManager().getId() : null)
                .joiningDate(employee.getJoiningDate())
                .active(employee.getActive())
                .createdAt(employee.getCreatedAt())
                .updatedAt(employee.getUpdatedAt())
                .build();
    }
}

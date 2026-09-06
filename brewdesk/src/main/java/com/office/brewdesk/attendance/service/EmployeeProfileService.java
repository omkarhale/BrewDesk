package com.office.brewdesk.attendance.service;

import com.office.brewdesk.attendance.dto.CreateEmployeeRequest;
import com.office.brewdesk.attendance.dto.EmployeeResponse;
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

        Shift shift = shiftRepository.findById(request.getShiftId())
                .orElseThrow(() ->
                        new IllegalArgumentException("Shift not found"));

        if (employeeProfileRepository.existsByEmployeeCode(
                request.getEmployeeCode().trim())) {

            throw new IllegalArgumentException(
                    "Employee code already exists"
            );
        }

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "User not found"
                        ));

        if (employeeProfileRepository.existsByUser(user)) {
            throw new IllegalArgumentException(
                    "Employee profile already exists for this user"
            );
        }

        Department department = null;

        if (request.getDepartmentId() != null) {
            department = departmentRepository.findById(
                    request.getDepartmentId()
            ).orElseThrow(() ->
                    new IllegalArgumentException(
                            "Department not found"
                    ));
        }

        User manager = null;

        if (request.getManagerId() != null) {
            manager = userRepository.findById(
                    request.getManagerId()
            ).orElseThrow(() ->
                    new IllegalArgumentException(
                            "Manager not found"
                    ));
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

        EmployeeProfile savedEmployee =
                employeeProfileRepository.save(employee);

        return mapToResponse(savedEmployee);
    }

    @Transactional(readOnly = true)
    public List<EmployeeResponse> getAllEmployees() {

        return employeeProfileRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public EmployeeResponse getEmployee(Long id) {

        EmployeeProfile employee =
                employeeProfileRepository.findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Employee not found"
                                ));

        return mapToResponse(employee);
    }

    private EmployeeResponse mapToResponse(
            EmployeeProfile employee
    ) {

        return EmployeeResponse.builder()
                .id(employee.getId())
                .userId(employee.getUser().getId())
                .employeeCode(employee.getEmployeeCode())
                .departmentId(
                        employee.getDepartment() != null
                                ? employee.getDepartment().getId()
                                : null
                )
                .departmentName(
                        employee.getDepartment() != null
                                ? employee.getDepartment().getName()
                                : null
                )
                .shiftId(
                        employee.getShift() != null
                                ? employee.getShift().getId()
                                : null
                )
                .shiftName(
                        employee.getShift() != null
                                ? employee.getShift().getName()
                                : null
                )
                .designation(employee.getDesignation())
                .managerId(
                        employee.getManager() != null
                                ? employee.getManager().getId()
                                : null
                )
                .joiningDate(employee.getJoiningDate())
                .active(employee.getActive())
                .createdAt(employee.getCreatedAt())
                .updatedAt(employee.getUpdatedAt())
                .build();
    }
    public EmployeeResponse updateEmployeeShift(
            Long employeeId,
            Long shiftId
    ) {

        EmployeeProfile employee =
                employeeProfileRepository.findById(employeeId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Employee not found"
                                ));

        Shift shift =
                shiftRepository.findById(shiftId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Shift not found"
                                ));

        employee.setShift(shift);

        EmployeeProfile updatedEmployee =
                employeeProfileRepository.save(employee);

        return mapToResponse(updatedEmployee);
    }
}
package com.office.brewdesk.attendance.service;

import com.office.brewdesk.attendance.dto.CreateDepartmentRequest;
import com.office.brewdesk.attendance.dto.DepartmentResponse;
import com.office.brewdesk.attendance.entity.Department;
import com.office.brewdesk.attendance.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public DepartmentResponse createDepartment(CreateDepartmentRequest request) {

        if (departmentRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException(
                    "Department code already exists"
            );
        }

        if (departmentRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException(
                    "Department name already exists"
            );
        }

        Department department = Department.builder()
                .name(request.getName().trim())
                .code(request.getCode().trim().toUpperCase())
                .active(true)
                .build();

        Department savedDepartment = departmentRepository.save(department);

        return mapToResponse(savedDepartment);
    }

    @Transactional(readOnly = true)
    public List<DepartmentResponse> getAllDepartments() {

        return departmentRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private DepartmentResponse mapToResponse(Department department) {

        return DepartmentResponse.builder()
                .id(department.getId())
                .name(department.getName())
                .code(department.getCode())
                .active(department.getActive())
                .createdAt(department.getCreatedAt())
                .updatedAt(department.getUpdatedAt())
                .build();
    }
}
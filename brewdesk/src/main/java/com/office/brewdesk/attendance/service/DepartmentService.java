package com.office.brewdesk.attendance.service;

import com.office.brewdesk.attendance.dto.CreateDepartmentRequest;
import com.office.brewdesk.attendance.dto.DepartmentResponse;
import com.office.brewdesk.attendance.dto.UpdateDepartmentRequest;
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
        if (departmentRepository.existsByCode(request.getCode().trim().toUpperCase())) {
            throw new IllegalArgumentException("Department code already exists");
        }
        if (departmentRepository.existsByName(request.getName().trim())) {
            throw new IllegalArgumentException("Department name already exists");
        }
        Department department = Department.builder()
                .name(request.getName().trim())
                .code(request.getCode().trim().toUpperCase())
                .active(true)
                .build();
        return mapToResponse(departmentRepository.save(department));
    }

    @Transactional(readOnly = true)
    public List<DepartmentResponse> getAllDepartments() {
        return departmentRepository.findAll().stream().map(this::mapToResponse).toList();
    }

    @Transactional(readOnly = true)
    public DepartmentResponse getDepartment(Long id) {
        return mapToResponse(findById(id));
    }

    public DepartmentResponse updateDepartment(Long id, UpdateDepartmentRequest request) {
        Department department = findById(id);
        String newName = request.getName().trim();
        String newCode = request.getCode().trim().toUpperCase();
        if (!department.getName().equals(newName) && departmentRepository.existsByName(newName)) {
            throw new IllegalArgumentException("Department name already exists");
        }
        if (!department.getCode().equals(newCode) && departmentRepository.existsByCode(newCode)) {
            throw new IllegalArgumentException("Department code already exists");
        }
        department.setName(newName);
        department.setCode(newCode);
        if (request.getActive() != null) {
            department.setActive(request.getActive());
        }
        return mapToResponse(departmentRepository.save(department));
    }

    public void deleteDepartment(Long id) {
        Department department = findById(id);
        departmentRepository.delete(department);
    }

    private Department findById(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Department not found"));
    }

    public DepartmentResponse mapToResponse(Department department) {
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

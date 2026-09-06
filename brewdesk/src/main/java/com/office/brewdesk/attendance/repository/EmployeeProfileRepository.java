package com.office.brewdesk.attendance.repository;

import com.office.brewdesk.attendance.entity.EmployeeProfile;
import com.office.brewdesk.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmployeeProfileRepository
        extends JpaRepository<EmployeeProfile, Long> {

    Optional<EmployeeProfile> findByEmployeeCode(String employeeCode);

    Optional<EmployeeProfile> findByUser(User user);

    boolean existsByEmployeeCode(String employeeCode);

    boolean existsByUser(User user);
}
package com.office.brewdesk.attendance.repository;

import com.office.brewdesk.attendance.entity.EmployeeProfile;
import com.office.brewdesk.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmployeeProfileRepository
        extends JpaRepository<EmployeeProfile, Long> {

    Optional<EmployeeProfile> findByEmployeeCode(String employeeCode);

    Optional<EmployeeProfile> findByUser(User user);

    Optional<EmployeeProfile> findByUserId(Long userId);

    boolean existsByEmployeeCode(String employeeCode);

    boolean existsByUser(User user);

    /** All employees who report to the given manager (User). */
    List<EmployeeProfile> findByManager(User manager);

    /** All employees who report to the given manager, filtered by active status. */
    List<EmployeeProfile> findByManagerAndActive(User manager, Boolean active);
}
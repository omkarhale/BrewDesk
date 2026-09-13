package com.office.brewdesk.leave.repository;

import com.office.brewdesk.leave.entity.LeaveType;
import com.office.brewdesk.leave.enums.GenderEligibility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LeaveTypeRepository extends JpaRepository<LeaveType, Long> {

    boolean existsByCodeIgnoreCase(String code);
    boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);
    Optional<LeaveType> findByCodeIgnoreCase(String code);
    List<LeaveType> findAllByActiveTrue();

    /**
     * Returns leave types eligible for the given gender.
     * GenderEligibility.ALL is always included.
     */
    @Query("SELECT lt FROM LeaveType lt WHERE lt.active = true " +
           "AND (lt.genderEligibility = 'ALL' OR lt.genderEligibility = :gender)")
    List<LeaveType> findEligibleForGender(@Param("gender") GenderEligibility gender);

    /**
     * Returns leave types assigned to a department via policy.
     */
    @Query("SELECT DISTINCT lt FROM LeaveType lt " +
           "JOIN lt.policies p " +
           "JOIN p.departments pd " +
           "WHERE lt.active = true AND p.active = true " +
           "AND pd.department.id = :departmentId " +
           "AND (lt.genderEligibility = 'ALL' OR lt.genderEligibility = :gender)")
    List<LeaveType> findEligibleForDepartmentAndGender(
            @Param("departmentId") Long departmentId,
            @Param("gender") GenderEligibility gender);
}

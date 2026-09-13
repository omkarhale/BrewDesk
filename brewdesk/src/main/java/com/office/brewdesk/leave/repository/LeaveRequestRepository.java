package com.office.brewdesk.leave.repository;

import com.office.brewdesk.leave.entity.LeaveRequest;
import com.office.brewdesk.leave.enums.LeaveStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    Page<LeaveRequest> findAllByEmployeeIdOrderByCreatedAtDesc(Long employeeId, Pageable pageable);

    List<LeaveRequest> findAllByEmployeeIdAndStatus(Long employeeId, LeaveStatus status);

    /** Pending requests for employees who report to the given manager. */
    @Query("SELECT lr FROM LeaveRequest lr " +
           "WHERE lr.employee.manager.id = :managerId " +
           "AND lr.status = 'PENDING' " +
           "ORDER BY lr.createdAt DESC")
    List<LeaveRequest> findPendingByManagerId(@Param("managerId") Long managerId);

    /** All requests for employees who report to the given manager. */
    @Query("SELECT lr FROM LeaveRequest lr " +
           "WHERE lr.employee.manager.id = :managerId " +
           "ORDER BY lr.createdAt DESC")
    Page<LeaveRequest> findAllByManagerId(@Param("managerId") Long managerId, Pageable pageable);

    /** Check for overlapping approved/pending requests. */
    @Query("SELECT lr FROM LeaveRequest lr " +
           "WHERE lr.employee.id = :employeeId " +
           "AND lr.status IN ('PENDING', 'APPROVED') " +
           "AND lr.startDate <= :endDate AND lr.endDate >= :startDate " +
           "AND (:excludeId IS NULL OR lr.id <> :excludeId)")
    List<LeaveRequest> findOverlapping(
            @Param("employeeId") Long employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("excludeId") Long excludeId);
}

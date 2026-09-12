package com.office.brewdesk.attendance.repository;

import com.office.brewdesk.attendance.entity.RegularizationRequest;
import com.office.brewdesk.attendance.enums.RegularizationStatus;
import com.office.brewdesk.attendance.enums.RegularizationType;
import com.office.brewdesk.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository for {@link RegularizationRequest}.
 *
 * Extends {@link JpaSpecificationExecutor} for the paginated + filtered
 * queries used by the admin and manager list views — exactly the same
 * pattern as {@link AttendanceRecordRepository} and
 * {@link AttendanceEventRepository}.
 *
 * Derived-query methods follow the Spring Data naming convention used
 * throughout the existing attendance repositories.
 */
public interface RegularizationRequestRepository
        extends JpaRepository<RegularizationRequest, Long>,
                JpaSpecificationExecutor<RegularizationRequest> {

    // ── Employee self-service ─────────────────────────────────────────────────

    /**
     * All requests submitted by a specific employee, newest first.
     * Used on the employee "My Requests" screen.
     */
    Page<RegularizationRequest> findByEmployeeIdOrderBySubmittedAtDesc(
            Long employeeId,
            Pageable pageable
    );

    /**
     * All requests for a specific employee filtered by status.
     * Useful for an employee checking their pending/approved/rejected requests.
     */
    Page<RegularizationRequest> findByEmployeeIdAndStatusOrderBySubmittedAtDesc(
            Long employeeId,
            RegularizationStatus status,
            Pageable pageable
    );

    // ── Duplicate / conflict detection ────────────────────────────────────────

    /**
     * Checks whether the employee already has a PENDING or APPROVED request
     * for the same date and type.
     *
     * Used before creating a new request to prevent duplicates.
     * The service passes {@code List.of(PENDING, APPROVED)} as the status list.
     */
    boolean existsByEmployeeIdAndAttendanceDateAndTypeAndStatusIn(
            Long employeeId,
            LocalDate attendanceDate,
            RegularizationType type,
            List<RegularizationStatus> statuses
    );

    // ── Manager approval queue ────────────────────────────────────────────────

    /**
     * All PENDING requests assigned to a specific manager, oldest first.
     *
     * The manager is the {@code User} stored in
     * {@code EmployeeProfile.manager}. We resolve it by joining through
     * the employee relationship: regularizationRequest → employee →
     * manager (which is a {@code User}).
     *
     * Named path: employee.manager matches EmployeeProfile.manager (User).
     */
    Page<RegularizationRequest> findByEmployeeManagerAndStatusOrderBySubmittedAtAsc(
            User manager,
            RegularizationStatus status,
            Pageable pageable
    );

    /**
     * Count of PENDING requests for a manager — used for the badge/counter
     * on the manager dashboard.
     */
    long countByEmployeeManagerAndStatus(
            User manager,
            RegularizationStatus status
    );

    /**
     * Total count of requests by status — used by SUPER_ADMIN / ADMIN
     * for the organisation-wide pending badge count.
     */
    long countByStatus(RegularizationStatus status);

    // ── Convenience lookup ────────────────────────────────────────────────────

    /**
     * Find a single request by id, only if it belongs to the given employee.
     * Used to enforce ownership before an employee cancels their own request.
     */
    Optional<RegularizationRequest> findByIdAndEmployeeId(
            Long id,
            Long employeeId
    );
}

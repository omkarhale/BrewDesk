package com.office.brewdesk.attendance.repository;

import com.office.brewdesk.attendance.entity.RegularizationRequest;
import com.office.brewdesk.attendance.enums.RegularizationStatus;
import com.office.brewdesk.attendance.enums.RegularizationType;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;

/**
 * Dynamic JPA {@link Specification} for paginated, filtered queries
 * on {@link RegularizationRequest}.
 *
 * Follows the exact same structure as {@link AttendanceRecordSpecification}
 * and {@link AttendanceEventSpecification}:
 * <ul>
 *   <li>Private constructor — static factory only.</li>
 *   <li>All parameters are nullable — only non-null values become predicates.</li>
 *   <li>Eager fetch guard uses {@code Long.class != query.getResultType()}
 *       to skip the join on count queries (standard pagination pattern).</li>
 *   <li>No {@code @Query} annotation — pure Criteria API.</li>
 * </ul>
 *
 * Used by:
 * <ul>
 *   <li>Admin/HR list view — all requests, any filters.</li>
 *   <li>Manager list view — filtered to own team + optional extra filters.</li>
 * </ul>
 */
public class RegularizationRequestSpecification {

    private RegularizationRequestSpecification() {}

    /**
     * Build a {@link Specification} that applies only the filters whose
     * parameters are non-null / non-blank.
     *
     * @param employeeCode   partial match on employee code (case-insensitive)
     * @param dateFrom       attendance date lower bound (inclusive), nullable
     * @param dateTo         attendance date upper bound (inclusive), nullable
     * @param status         exact status match, nullable
     * @param type           exact type match, nullable
     * @param reviewedById   exact reviewer user id, nullable
     */
    public static Specification<RegularizationRequest> withFilters(
            String employeeCode,
            LocalDate dateFrom,
            LocalDate dateTo,
            RegularizationStatus status,
            RegularizationType type,
            Long reviewedById
    ) {
        return (root, query, cb) -> {

            // ── Eager-fetch associations to avoid N+1 on data queries ─────────
            // Skipped on the count query Spring Data executes for pagination.
            if (query != null && Long.class != query.getResultType()) {
                root.fetch("employee", JoinType.INNER)
                    .fetch("user", JoinType.INNER);     // employee → user (for name display)
                root.fetch("employee", JoinType.INNER)
                    .fetch("manager", JoinType.LEFT);   // employee → manager (nullable)
            }

            var predicates =
                    new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();

            // employee code — partial, case-insensitive
            if (employeeCode != null && !employeeCode.isBlank()) {
                predicates.add(cb.like(
                        cb.lower(root.get("employee").get("employeeCode")),
                        "%" + employeeCode.trim().toLowerCase() + "%"
                ));
            }

            // attendance date range
            if (dateFrom != null) {
                predicates.add(cb.greaterThanOrEqualTo(
                        root.get("attendanceDate"), dateFrom
                ));
            }
            if (dateTo != null) {
                predicates.add(cb.lessThanOrEqualTo(
                        root.get("attendanceDate"), dateTo
                ));
            }

            // exact status match
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            // exact type match
            if (type != null) {
                predicates.add(cb.equal(root.get("type"), type));
            }

            // reviewed by — filter by reviewer user id
            if (reviewedById != null) {
                predicates.add(cb.equal(
                        root.get("reviewedBy").get("id"), reviewedById
                ));
            }

            return cb.and(predicates.toArray(
                    new jakarta.persistence.criteria.Predicate[0]
            ));
        };
    }
}

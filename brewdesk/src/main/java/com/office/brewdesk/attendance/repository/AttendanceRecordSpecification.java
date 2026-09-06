package com.office.brewdesk.attendance.repository;

import com.office.brewdesk.attendance.entity.AttendanceRecord;
import com.office.brewdesk.attendance.enums.AttendanceStatus;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;

public class AttendanceRecordSpecification {

    private AttendanceRecordSpecification() {}

    /**
     * Builds a dynamic Specification — only adds predicates for non-null
     * parameters, so PostgreSQL never receives a bare untyped NULL.
     */
    public static Specification<AttendanceRecord> withFilters(
            String employeeCode,
            LocalDate dateFrom,
            LocalDate dateTo,
            AttendanceStatus status
    ) {
        return (root, query, cb) -> {

            // Eagerly fetch associations to avoid N+1
            if (query != null && Long.class != query.getResultType()) {
                root.fetch("employee", JoinType.INNER);
                root.fetch("shift", JoinType.INNER);
            }

            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();

            if (employeeCode != null && !employeeCode.isBlank()) {
                predicates.add(cb.like(
                        cb.lower(root.get("employee").get("employeeCode")),
                        "%" + employeeCode.trim().toLowerCase() + "%"
                ));
            }

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

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            return cb.and(predicates.toArray(
                    new jakarta.persistence.criteria.Predicate[0]
            ));
        };
    }
}

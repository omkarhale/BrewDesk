package com.office.brewdesk.attendance.repository;

import com.office.brewdesk.attendance.entity.AttendanceEvent;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;

public class AttendanceEventSpecification {

    private AttendanceEventSpecification() {}

    public static Specification<AttendanceEvent> withFilters(
            String employeeCode,
            LocalDateTime dateFrom,
            LocalDateTime dateTo
    ) {
        return (root, query, cb) -> {
            if (query != null && Long.class != query.getResultType()) {
                root.fetch("employee", JoinType.INNER);
            }
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();

            if (employeeCode != null && !employeeCode.isBlank()) {
                predicates.add(cb.like(
                        cb.lower(root.get("employee").get("employeeCode")),
                        "%" + employeeCode.trim().toLowerCase() + "%"
                ));
            }
            if (dateFrom != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("eventTime"), dateFrom));
            }
            if (dateTo != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("eventTime"), dateTo));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }
}

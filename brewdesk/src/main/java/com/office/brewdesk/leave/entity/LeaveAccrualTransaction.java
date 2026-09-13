package com.office.brewdesk.leave.entity;

import com.office.brewdesk.attendance.entity.EmployeeProfile;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.YearMonth;

@Entity
@Table(name = "leave_accrual_transactions",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_accrual_employee_type_period",
        columnNames = {"employee_id", "leave_type_id", "accrual_period"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LeaveAccrualTransaction {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private EmployeeProfile employee;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "leave_type_id", nullable = false)
    private LeaveType leaveType;

    /** Format: YYYY-MM (e.g. "2025-09") — used for uniqueness constraint. */
    @Column(nullable = false, length = 7)
    private String accrualPeriod;

    @Column(nullable = false)
    private Double amount;

    /** Reference note — e.g. "Monthly accrual for 2025-09". */
    @Column(length = 300)
    private String reference;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public static String periodKey(YearMonth ym) {
        return ym.toString(); // "YYYY-MM"
    }
}

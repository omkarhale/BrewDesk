package com.office.brewdesk.leave.entity;

import com.office.brewdesk.attendance.entity.EmployeeProfile;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "employee_leave_balances",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_employee_leave_type",
        columnNames = {"employee_id", "leave_type_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EmployeeLeaveBalance {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private EmployeeProfile employee;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "leave_type_id", nullable = false)
    private LeaveType leaveType;

    @Column(nullable = false)
    @Builder.Default
    private Double openingBalance = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Double accrued = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Double used = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Double pending = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Double adjusted = 0.0;

    /** Computed: openingBalance + accrued + adjusted - used */
    @Column(nullable = false)
    @Builder.Default
    private Double available = 0.0;

    private LocalDateTime lastCalculatedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /** Recalculate available = openingBalance + accrued + adjusted - used */
    public void recalculate() {
        this.available = this.openingBalance + this.accrued + this.adjusted - this.used;
        this.lastCalculatedAt = LocalDateTime.now();
    }
}

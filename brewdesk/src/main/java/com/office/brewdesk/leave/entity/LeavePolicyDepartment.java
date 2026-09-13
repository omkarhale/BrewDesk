package com.office.brewdesk.leave.entity;

import com.office.brewdesk.attendance.entity.Department;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "leave_policy_departments",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_policy_department",
        columnNames = {"leave_policy_id", "department_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LeavePolicyDepartment {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "leave_policy_id", nullable = false)
    private LeavePolicy leavePolicy;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

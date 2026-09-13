package com.office.brewdesk.leave.entity;

import com.office.brewdesk.leave.enums.AccrualStartRule;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "leave_policies")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LeavePolicy {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "leave_type_id", nullable = false)
    private LeaveType leaveType;

    @Column(nullable = false, length = 150)
    private String policyName;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    @Builder.Default
    private AccrualStartRule accrualStartRule = AccrualStartRule.JOINING_DATE;

    /** Minimum notice days before leave start date. */
    @Column(nullable = false)
    @Builder.Default
    private Integer minimumNoticeDays = 0;

    /** Maximum consecutive days allowed in one request. */
    @Column(nullable = false)
    @Builder.Default
    private Integer maximumConsecutiveDays = 30;

    @Column(nullable = false)
    @Builder.Default
    private Boolean backdatedAllowed = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean cancellationAllowed = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean approvalRequired = true;

    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @OneToMany(mappedBy = "leavePolicy", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<LeavePolicyDepartment> departments = new ArrayList<>();

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
}

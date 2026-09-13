package com.office.brewdesk.leave.entity;

import com.office.brewdesk.leave.enums.AccrualFrequency;
import com.office.brewdesk.leave.enums.GenderEligibility;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "leave_types",
    uniqueConstraints = @UniqueConstraint(name = "uk_leave_type_code", columnNames = "code"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LeaveType {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    /** Whether leave is paid (true) or unpaid (false, e.g. LWP). */
    @Column(nullable = false)
    @Builder.Default
    private Boolean paid = true;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private GenderEligibility genderEligibility = GenderEligibility.ALL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private AccrualFrequency accrualFrequency = AccrualFrequency.NONE;

    /** Monthly accrual amount — relevant when accrualFrequency = MONTHLY (e.g. 1.25 for PL). */
    @Column(nullable = false)
    @Builder.Default
    private Double accrualAmount = 0.0;

    /** Yearly allocation — relevant when accrualFrequency = YEARLY (e.g. SL=12, CL=6). */
    @Column(nullable = false)
    @Builder.Default
    private Double yearlyAllocation = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Boolean halfDayAllowed = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean carryForwardEnabled = false;

    @Column(nullable = false)
    @Builder.Default
    private Double carryForwardLimit = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Boolean documentRequired = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @OneToMany(mappedBy = "leaveType", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<LeavePolicy> policies = new ArrayList<>();

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

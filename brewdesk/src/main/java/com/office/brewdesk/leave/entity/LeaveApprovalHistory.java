package com.office.brewdesk.leave.entity;

import com.office.brewdesk.entity.User;
import com.office.brewdesk.leave.enums.LeaveApprovalAction;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "leave_approval_history")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LeaveApprovalHistory {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "leave_request_id", nullable = false)
    private LeaveRequest leaveRequest;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LeaveApprovalAction action;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by")
    private User performedBy;

    @Column(length = 500)
    private String remarks;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

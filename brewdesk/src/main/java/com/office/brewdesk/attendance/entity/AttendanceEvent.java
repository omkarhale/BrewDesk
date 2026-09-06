package com.office.brewdesk.attendance.entity;

import com.office.brewdesk.attendance.enums.AttendanceEventType;
import com.office.brewdesk.attendance.enums.AttendanceSource;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "attendance_events",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_device_external_event",
                        columnNames = {
                                "device_id",
                                "external_event_id"
                        }
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private EmployeeProfile employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id")
    private AttendanceDevice device;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AttendanceEventType eventType;

    @Column(nullable = false)
    private LocalDateTime eventTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AttendanceSource attendanceSource;

    @Column(name = "external_event_id", length = 100)
    private String externalEventId;

    @Column(columnDefinition = "TEXT")
    private String rawPayload;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
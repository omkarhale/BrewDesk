package com.office.brewdesk.attendance.repository;

import com.office.brewdesk.attendance.entity.AttendanceEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.List;

public interface AttendanceEventRepository
        extends JpaRepository<AttendanceEvent, Long>,
                JpaSpecificationExecutor<AttendanceEvent> {

    List<AttendanceEvent> findByEmployeeIdAndEventTimeBetweenOrderByEventTimeAsc(
            Long employeeId,
            LocalDateTime start,
            LocalDateTime end
    );

    boolean existsByDeviceIdAndExternalEventId(
            Long deviceId,
            String externalEventId
    );
}

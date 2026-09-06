package com.office.brewdesk.attendance.repository;

import com.office.brewdesk.attendance.entity.AttendanceSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AttendanceSessionRepository
        extends JpaRepository<AttendanceSession, Long> {

    List<AttendanceSession> findByAttendanceRecordIdOrderByPunchInAsc(
            Long attendanceRecordId
    );

    void deleteByAttendanceRecordId(Long attendanceRecordId);
}
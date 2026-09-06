package com.office.brewdesk.attendance.repository;

import com.office.brewdesk.attendance.entity.AttendanceDevice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AttendanceDeviceRepository
        extends JpaRepository<AttendanceDevice, Long> {

    Optional<AttendanceDevice> findByDeviceCode(String deviceCode);

    boolean existsByDeviceCode(String deviceCode);
}
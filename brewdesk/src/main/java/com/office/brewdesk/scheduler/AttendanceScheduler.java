package com.office.brewdesk.scheduler;

import com.office.brewdesk.attendance.dto.BulkCalculationRequest;
import com.office.brewdesk.attendance.dto.BulkCalculationResponse;
import com.office.brewdesk.attendance.service.AttendanceCalculationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class AttendanceScheduler {

    private final AttendanceCalculationService attendanceCalculationService;

    /**
     * Automatically calculates attendance for all active employees every night at 23:55.
     */
    @Scheduled(cron = "0 55 23 * * *")
    public void scheduleDailyAttendanceCalculation() {
        LocalDate today = LocalDate.now();
        log.info("Starting scheduled end-of-day attendance calculation for {}", today);
        try {
            BulkCalculationRequest request = new BulkCalculationRequest();
            request.setDateFrom(today);
            request.setDateTo(today);
            BulkCalculationResponse response = attendanceCalculationService.bulkCalculate(request);
            log.info("Completed scheduled attendance calculation: {} successful, {} skipped, {} errors",
                    response.getSuccessCount(), response.getSkippedCount(), response.getErrorCount());
        } catch (Exception ex) {
            log.error("Error during scheduled attendance calculation: {}", ex.getMessage(), ex);
        }
    }
}

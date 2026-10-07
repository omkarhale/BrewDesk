package com.office.brewdesk.scheduler;

import com.office.brewdesk.service.RoundService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class PantryScheduler {

    private final RoundService roundService;

    /**
     * Initializes today's beverage rounds daily at 06:00 AM.
     */
    @Scheduled(cron = "0 0 6 * * *")
    public void scheduleDailyRoundCreation() {
        LocalDate today = LocalDate.now();
        log.info("Starting scheduled daily beverage round creation for {}", today);
        try {
            roundService.createTodayRounds();
            log.info("Successfully initialized beverage rounds for {}", today);
        } catch (Exception ex) {
            log.error("Failed to initialize beverage rounds for {}: {}", today, ex.getMessage(), ex);
        }
    }
}

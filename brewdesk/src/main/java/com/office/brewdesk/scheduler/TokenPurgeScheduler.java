package com.office.brewdesk.scheduler;

import com.office.brewdesk.repository.RevokedTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Component
@RequiredArgsConstructor
@Slf4j
public class TokenPurgeScheduler {

    private final RevokedTokenRepository revokedTokenRepository;

    /**
     * Purges expired revoked tokens daily at 03:00 AM.
     */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void purgeExpiredTokens() {
        Instant now = Instant.now();
        log.info("Starting scheduled purge of expired revoked JWT tokens before {}", now);
        try {
            revokedTokenRepository.deleteByExpiresAtBefore(now);
            log.info("Successfully purged expired revoked tokens");
        } catch (Exception ex) {
            log.error("Failed to purge expired tokens: {}", ex.getMessage(), ex);
        }
    }
}

package com.demo.backend.timer;

import java.time.Clock;
import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Background job: forgets timer command ids older than {@code app.timer.command-retention-hours}
 * (default 24). A retry after that long is not expected.
 */
@Component
public class TimerCommandCleanup {

    private static final Logger log = LoggerFactory.getLogger(TimerCommandCleanup.class);

    private final TimerService timerService;
    private final Clock clock;
    private final Duration retention;

    public TimerCommandCleanup(TimerService timerService, Clock clock,
                               @Value("${app.timer.command-retention-hours:24}") long retentionHours) {
        this.timerService = timerService;
        this.clock = clock;
        this.retention = Duration.ofHours(retentionHours);
    }

    @Scheduled(fixedDelayString = "${app.timer.cleanup-interval-ms:3600000}")
    public void cleanUp() {
        try {
            int deleted = timerService.forgetCommandsOlderThan(clock.instant().minus(retention));
            if (deleted > 0) {
                log.info("[timer] forgot {} old command id(s)", deleted);
            }
        } catch (RuntimeException ex) {
            // The next run tries again.
            log.error("[timer] command clean-up failed", ex);
        }
    }
}

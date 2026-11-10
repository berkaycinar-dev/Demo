package com.demo.backend.point;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Points: writes them when the timer reports a finished focus block, and reads totals and history.
 * The arithmetic is in {@link PointRules}; who may earn is decided by {@link PointEligibility}.
 */
@Service
public class PointService {

    static final int DEFAULT_PAGE_SIZE = 20;
    static final int MAX_PAGE_SIZE = 100;

    private final PointEventRepository events;
    private final PointEligibility eligibility;
    private final PointRules rules;
    private final PointProperties properties;
    private final Clock clock;

    public PointService(PointEventRepository events, PointEligibility eligibility, PointRules rules,
                        PointProperties properties, Clock clock) {
        this.events = events;
        this.eligibility = eligibility;
        this.rules = rules;
        this.properties = properties;
        this.clock = clock;
    }

    /**
     * Credits one finished focus block. Called by the timer inside its own transaction, so the block
     * and its points are saved together or not at all. Safe to call twice for the same block.
     *
     * @return the new point event, or empty when the user was not eligible, the block was already
     *         credited, or it is worth nothing
     */
    @Transactional
    public Optional<PointEvent> awardFocusBlock(UUID userId, String preset, int focusSeconds, Instant endedAt) {
        if (!eligibility.isEligible(userId, endedAt)) {
            return Optional.empty();
        }
        PointRules.Award award = rules.forFocusBlock(preset, focusSeconds);
        if (award.total() <= 0) {
            return Optional.empty();
        }
        String sourceKey = "timer:" + endedAt.toEpochMilli();
        if (events.existsByUserIdAndKindAndSourceKey(userId, PointKind.FOCUS_BLOCK, sourceKey)) {
            return Optional.empty();
        }
        PointEvent saved = events.save(new PointEvent(userId, PointKind.FOCUS_BLOCK, sourceKey, award,
                focusSeconds, preset, endedAt, clock.instant()));
        return Optional.of(saved);
    }

    @Transactional(readOnly = true)
    public PointSummaryResponse summary(UUID userId) {
        Instant now = clock.instant();
        ZoneId zone = ZoneId.of(properties.dayZone());
        LocalDate today = now.atZone(zone).toLocalDate();
        Instant from = today.atStartOfDay(zone).toInstant();
        Instant to = today.plusDays(1).atStartOfDay(zone).toInstant();

        PointEventRepository.Totals totals = events.totals(userId);
        return new PointSummaryResponse(totals.getPoints().longValue(), events.pointsBetween(userId, from, to),
                totals.getBlocks().longValue(), totals.getFocusSeconds().longValue(), now);
    }

    /** History, newest first. Page below 0 becomes 0; size is clamped into 1..100. */
    @Transactional(readOnly = true)
    public PointEventPage history(UUID userId, int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.min(Math.max(1, size), MAX_PAGE_SIZE);
        Sort newestFirst = Sort.by(Sort.Order.desc("earnedAt"), Sort.Order.desc("id"));
        return PointEventPage.of(events.findByUserId(userId, PageRequest.of(safePage, safeSize, newestFirst)));
    }
}

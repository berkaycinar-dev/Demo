package com.demo.backend.point;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/** Unit test: repository and eligibility are mocks. No Spring, no database. */
class PointServiceTest {

    private static final Instant NOW = Instant.parse("2026-11-10T13:00:00Z");
    private static final Instant ENDED = Instant.parse("2026-11-10T12:00:00Z");
    private static final UUID ME = UUID.randomUUID();

    private final PointEventRepository events = mock(PointEventRepository.class);
    private final PointEligibility eligibility = mock(PointEligibility.class);
    private final PointProperties properties =
            new PointProperties(1, Map.of("25-5", 0, "50-10", 10, "90-15", 25), "Europe/Istanbul");
    private final PointService service = new PointService(events, eligibility, new PointRules(properties),
            properties, Clock.fixed(NOW, ZoneOffset.UTC));

    // ---------- awarding ----------

    @Test
    void eligibleBlockIsSavedWithItsBreakdownAndEndTime() {
        when(eligibility.isEligible(ME, ENDED)).thenReturn(true);
        when(events.save(any(PointEvent.class))).thenAnswer(i -> i.getArgument(0));

        Optional<PointEvent> saved = service.awardFocusBlock(ME, "50-10", 3000, ENDED);

        assertThat(saved).isPresent();
        PointEvent e = saved.get();
        assertThat(e.getUserId()).isEqualTo(ME);
        assertThat(e.getKind()).isEqualTo(PointKind.FOCUS_BLOCK);
        assertThat(e.getPoints()).isEqualTo(60);
        assertThat(e.getBasePoints()).isEqualTo(50);
        assertThat(e.getBonusPoints()).isEqualTo(10);
        assertThat(e.getFocusSeconds()).isEqualTo(3000);
        assertThat(e.getPreset()).isEqualTo("50-10");
        assertThat(e.getEarnedAt()).isEqualTo(ENDED);
        assertThat(e.getCreatedAt()).isEqualTo(NOW);
        assertThat(e.getSourceKey()).isEqualTo("timer:" + ENDED.toEpochMilli());
    }

    @Test
    void userOutsideAnyRoomEarnsNothing() {
        when(eligibility.isEligible(ME, ENDED)).thenReturn(false);

        assertThat(service.awardFocusBlock(ME, "25-5", 1500, ENDED)).isEmpty();

        verify(events, never()).save(any());
    }

    @Test
    void eligibilityIsAskedAboutTheMomentTheBlockEndedNotNow() {
        when(eligibility.isEligible(ME, ENDED)).thenReturn(false);

        service.awardFocusBlock(ME, "25-5", 1500, ENDED);

        verify(eligibility).isEligible(ME, ENDED);
    }

    @Test
    void sameBlockIsCreditedOnlyOnce() {
        when(eligibility.isEligible(ME, ENDED)).thenReturn(true);
        when(events.existsByUserIdAndKindAndSourceKey(ME, PointKind.FOCUS_BLOCK, "timer:" + ENDED.toEpochMilli()))
                .thenReturn(true);

        assertThat(service.awardFocusBlock(ME, "25-5", 1500, ENDED)).isEmpty();

        verify(events, never()).save(any());
    }

    @Test
    void blockWorthNothingIsNotSaved() {
        PointProperties zero = new PointProperties(0, Map.of(), "UTC");
        PointService free = new PointService(events, eligibility, new PointRules(zero), zero,
                Clock.fixed(NOW, ZoneOffset.UTC));
        when(eligibility.isEligible(ME, ENDED)).thenReturn(true);

        assertThat(free.awardFocusBlock(ME, "25-5", 1500, ENDED)).isEmpty();

        verify(events, never()).save(any());
    }

    // ---------- summary ----------

    private static PointEventRepository.Totals totals(long points, long blocks, long seconds) {
        PointEventRepository.Totals t = mock(PointEventRepository.Totals.class);
        when(t.getPoints()).thenReturn(points);
        when(t.getBlocks()).thenReturn(blocks);
        when(t.getFocusSeconds()).thenReturn(seconds);
        return t;
    }

    @Test
    void summaryCombinesTotalsAndToday() {
        PointEventRepository.Totals totals = totals(170, 3, 6000);
        when(events.totals(ME)).thenReturn(totals);
        // 13:00 UTC = 16:00 in Istanbul (UTC+3): today is 2026-11-10 from 21:00Z the day before
        when(events.pointsBetween(ME, Instant.parse("2026-11-09T21:00:00Z"), Instant.parse("2026-11-10T21:00:00Z")))
                .thenReturn(60L);

        PointSummaryResponse res = service.summary(ME);

        assertThat(res.totalPoints()).isEqualTo(170);
        assertThat(res.todayPoints()).isEqualTo(60);
        assertThat(res.completedBlocks()).isEqualTo(3);
        assertThat(res.focusSeconds()).isEqualTo(6000);
        assertThat(res.serverTime()).isEqualTo(NOW);
    }

    @Test
    void todayStartsAtMidnightOfTheConfiguredZone() {
        // 22:30 UTC = 01:30 on 11 Nov in Istanbul, so "today" is already the 11th there
        PointService late = new PointService(events, eligibility, new PointRules(properties), properties,
                Clock.fixed(Instant.parse("2026-11-10T22:30:00Z"), ZoneOffset.UTC));
        PointEventRepository.Totals totals = totals(0, 0, 0);
        when(events.totals(ME)).thenReturn(totals);

        late.summary(ME);

        verify(events).pointsBetween(ME, Instant.parse("2026-11-10T21:00:00Z"), Instant.parse("2026-11-11T21:00:00Z"));
    }

    // ---------- history ----------

    private Pageable historyPageable(int page, int size) {
        when(events.findByUserId(eq(ME), any(Pageable.class))).thenReturn(Page.empty());
        service.history(ME, page, size);
        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(events).findByUserId(eq(ME), captor.capture());
        return captor.getValue();
    }

    @Test
    void historyIsNewestFirst() {
        Pageable p = historyPageable(2, 10);

        assertThat(p.getPageNumber()).isEqualTo(2);
        assertThat(p.getPageSize()).isEqualTo(10);
        assertThat(p.getSort().getOrderFor("earnedAt").getDirection()).isEqualTo(Sort.Direction.DESC);
        assertThat(p.getSort().getOrderFor("id").getDirection()).isEqualTo(Sort.Direction.DESC);
    }

    @Test
    void negativePageBecomesZero() {
        assertThat(historyPageable(-4, 10).getPageNumber()).isZero();
    }

    @Test
    void sizeIsClampedBetweenOneAndOneHundred() {
        assertThat(historyPageable(0, 0).getPageSize()).isEqualTo(1);
    }

    @Test
    void tooBigSizeIsClampedToOneHundred() {
        assertThat(historyPageable(0, 5000).getPageSize()).isEqualTo(100);
    }

    @Test
    void historyMapsEventsToResponses() {
        PointEvent e = new PointEvent(ME, PointKind.FOCUS_BLOCK, "timer:1", new PointRules.Award(25, 0), 1500,
                "25-5", ENDED, NOW);
        when(events.findByUserId(eq(ME), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(e), Pageable.ofSize(20), 41));

        PointEventPage page = service.history(ME, 0, 20);

        assertThat(page.items()).hasSize(1);
        assertThat(page.items().get(0).points()).isEqualTo(25);
        assertThat(page.items().get(0).earnedAt()).isEqualTo(ENDED);
        assertThat(page.totalItems()).isEqualTo(41);
        assertThat(page.totalPages()).isEqualTo(3);
        assertThat(page.size()).isEqualTo(20);
    }
}

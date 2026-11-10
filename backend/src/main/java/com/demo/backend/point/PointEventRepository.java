package com.demo.backend.point;

import java.time.Instant;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PointEventRepository extends JpaRepository<PointEvent, UUID> {

    boolean existsByUserIdAndKindAndSourceKey(UUID userId, PointKind kind, String sourceKey);

    Page<PointEvent> findByUserId(UUID userId, Pageable pageable);

    /** All of one user's totals in one query. Sums are Numbers because the exact SQL type may vary. */
    @Query("""
            select coalesce(sum(e.points), 0L) as points,
                   count(e) as blocks,
                   coalesce(sum(e.focusSeconds), 0L) as focusSeconds
            from PointEvent e
            where e.userId = :userId
            """)
    Totals totals(@Param("userId") UUID userId);

    /** Points earned in [from, to). */
    @Query("""
            select coalesce(sum(e.points), 0L)
            from PointEvent e
            where e.userId = :userId and e.earnedAt >= :from and e.earnedAt < :to
            """)
    long pointsBetween(@Param("userId") UUID userId, @Param("from") Instant from, @Param("to") Instant to);

    interface Totals {
        Number getPoints();

        Number getBlocks();

        Number getFocusSeconds();
    }
}

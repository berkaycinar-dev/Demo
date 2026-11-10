package com.demo.backend.timer;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TimerCommandRepository extends JpaRepository<TimerCommand, UUID> {

    Optional<TimerCommand> findByUserIdAndCommandId(UUID userId, UUID commandId);

    /** @return how many remembered commands were deleted */
    @Modifying
    @Query("delete from TimerCommand c where c.createdAt < :cutoff")
    int deleteOlderThan(@Param("cutoff") Instant cutoff);
}

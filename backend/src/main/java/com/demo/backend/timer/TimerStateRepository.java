package com.demo.backend.timer;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TimerStateRepository extends JpaRepository<TimerState, UUID> {

    /** Locks the user's row so two requests of the same user are handled one after the other. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from TimerState t where t.userId = :userId")
    Optional<TimerState> findByUserIdForUpdate(@Param("userId") UUID userId);

    /** Creates the user's idle timer if it does not exist yet. Safe when two requests race. */
    @Modifying
    @Query(value = """
            insert into timer_states (user_id, preset, phase, status, remaining_seconds, version, completed_focus_blocks)
            values (:userId, :preset, 'FOCUS', 'IDLE', :remainingSeconds, 0, 0)
            on conflict (user_id) do nothing
            """, nativeQuery = true)
    void insertIfAbsent(@Param("userId") UUID userId, @Param("preset") String preset,
                        @Param("remainingSeconds") int remainingSeconds);
}

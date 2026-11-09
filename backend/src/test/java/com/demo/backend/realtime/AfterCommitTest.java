package com.demo.backend.realtime;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

class AfterCommitTest {

    @AfterEach
    void cleanUp() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void runsAtOnceWithoutATransaction() {
        AtomicInteger runs = new AtomicInteger();

        AfterCommit.run(runs::incrementAndGet);

        assertThat(runs.get()).isEqualTo(1);
    }

    @Test
    void waitsForCommitInsideATransaction() {
        AtomicInteger runs = new AtomicInteger();
        TransactionSynchronizationManager.initSynchronization();

        AfterCommit.run(runs::incrementAndGet);
        assertThat(runs.get()).isZero();

        TransactionSynchronizationManager.getSynchronizations().forEach(TransactionSynchronization::afterCommit);
        assertThat(runs.get()).isEqualTo(1);
    }

    @Test
    void neverRunsOnRollback() {
        AtomicInteger runs = new AtomicInteger();
        TransactionSynchronizationManager.initSynchronization();

        AfterCommit.run(runs::incrementAndGet);
        TransactionSynchronizationManager.getSynchronizations()
                .forEach(s -> s.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK));

        assertThat(runs.get()).isZero();
    }

    @Test
    void aFailingActionDoesNotBreakTheCaller() {
        AfterCommit.run(() -> {
            throw new IllegalStateException("broadcast failed");
        });
        // reaching this line is the assertion
    }
}

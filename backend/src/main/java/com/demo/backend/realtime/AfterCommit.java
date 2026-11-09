package com.demo.backend.realtime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Runs an action only after the current database transaction has committed.
 *
 * Room events must describe things that really happened. If a service published an event inside
 * its transaction and the commit then failed, clients would hear about a change that never
 * happened. Services wrap {@code events.publish(...)} in {@link #run(Runnable)}.
 *
 * With no transaction running (for example in a plain unit test) the action runs at once.
 * A failing action is logged and never breaks the request, because the data is already saved.
 */
public final class AfterCommit {

    private static final Logger log = LoggerFactory.getLogger(AfterCommit.class);

    private AfterCommit() {
    }

    public static void run(Runnable action) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    runSafely(action);
                }
            });
        } else {
            runSafely(action);
        }
    }

    private static void runSafely(Runnable action) {
        try {
            action.run();
        } catch (RuntimeException ex) {
            log.error("[after-commit] action failed", ex);
        }
    }
}

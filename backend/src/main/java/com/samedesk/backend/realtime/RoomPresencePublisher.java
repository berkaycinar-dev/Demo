package com.samedesk.backend.realtime;

import com.samedesk.backend.room.ActiveMemberResponse;
import com.samedesk.backend.room.RoomSessionRepository;
import java.time.Clock;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Streams complete snapshots from C's existing session/heartbeat/timeout model. */
@Component
class RoomPresencePublisher {

    private static final Logger log = LoggerFactory.getLogger(RoomPresencePublisher.class);

    private final SimpUserRegistry users;
    private final RoomSessionRepository sessions;
    private final SimpMessagingTemplate messaging;
    private final Clock clock;

    RoomPresencePublisher(SimpUserRegistry users, RoomSessionRepository sessions,
                          SimpMessagingTemplate messaging, Clock clock) {
        this.users = users;
        this.sessions = sessions;
        this.messaging = messaging;
        this.clock = clock;
    }

    @Scheduled(fixedDelayString = "${app.presence.publish-interval-ms:2000}")
    void publishSnapshots() {
        List<UUID> rooms = users.findSubscriptions(s -> StompRoomAccess.presenceRoom(s.getDestination()).isPresent())
                .stream().map(s -> StompRoomAccess.presenceRoom(s.getDestination()).orElseThrow())
                .distinct().toList();

        for (UUID roomId : rooms) {
            try {
                List<ActiveMemberResponse> members = sessions.findActive(roomId).stream()
                        .map(ActiveMemberResponse::of)
                        .toList();
                var snapshot = new StompRoomEventPublisher.RoomEvent(1, UUID.randomUUID(), "PRESENCE_SNAPSHOT",
                        roomId, clock.instant().toString(), new Presence(members));
                messaging.convertAndSend(StompRoomAccess.presenceDestination(roomId), snapshot);
            } catch (RuntimeException ex) {
                // Retry this room on the next tick and let other rooms receive their snapshots.
                log.warn("Presence snapshot failed for room={}", roomId, ex);
            }
        }
    }

    record Presence(List<ActiveMemberResponse> members) { }
}

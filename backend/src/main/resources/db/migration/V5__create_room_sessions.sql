-- Room sessions (H4): one row per visit to a room (enter -> exit).
-- Time spent and points are computed from these rows later, so a row is never deleted by the app.
--
-- Membership (room_members, V4) says who belongs to a room.
-- A session says who is inside the room right now (ended_at IS NULL) or was inside before.
--
-- last_seen_at is refreshed by heartbeats. If it gets older than the timeout (60 seconds by default),
-- a background job closes the session with end_reason TIMEOUT and ended_at = last_seen_at,
-- so the time after the connection dropped is not counted.

CREATE TABLE room_sessions (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id      uuid        NOT NULL REFERENCES rooms (id) ON DELETE CASCADE,
    user_id      uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    started_at   timestamptz NOT NULL DEFAULT now(),
    last_seen_at timestamptz NOT NULL DEFAULT now(),
    ended_at     timestamptz,
    end_reason   varchar(10),
    CONSTRAINT room_sessions_end_reason_valid CHECK (end_reason IN ('EXIT', 'TIMEOUT', 'LEFT_ROOM')),
    CONSTRAINT room_sessions_end_pair CHECK ((ended_at IS NULL) = (end_reason IS NULL)),
    CONSTRAINT room_sessions_time_order CHECK (last_seen_at >= started_at AND (ended_at IS NULL OR ended_at >= started_at))
);

-- A user has at most one open session per room.
CREATE UNIQUE INDEX room_sessions_one_open_key ON room_sessions (room_id, user_id) WHERE ended_at IS NULL;

-- "Who is in this room now?" and "close stale sessions" only look at open rows.
CREATE INDEX room_sessions_open_seen_idx ON room_sessions (last_seen_at) WHERE ended_at IS NULL;

-- A user's history, newest first (time and points per user).
CREATE INDEX room_sessions_user_started_idx ON room_sessions (user_id, started_at DESC);

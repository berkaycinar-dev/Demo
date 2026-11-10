-- Points (H6).
-- point_events: one row per reason a user earned points. Rows are never updated or deleted by the app;
--   totals are summed from them. A finished focus block is credited once: (user_id, kind, source_key) is unique,
--   and source_key identifies the block (for FOCUS_BLOCK: "timer:" + the block's end time in epoch millis).

CREATE TABLE point_events (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    kind         varchar(20) NOT NULL,
    source_key   varchar(64) NOT NULL,
    points       integer     NOT NULL,
    base_points  integer     NOT NULL,
    bonus_points integer     NOT NULL,
    focus_seconds integer    NOT NULL,
    preset       varchar(10) NOT NULL,
    earned_at    timestamptz NOT NULL,
    created_at   timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT point_events_kind_valid CHECK (kind IN ('FOCUS_BLOCK')),
    CONSTRAINT point_events_preset_valid CHECK (preset IN ('25-5', '50-10', '90-15')),
    CONSTRAINT point_events_points_positive CHECK (points > 0),
    CONSTRAINT point_events_parts_not_negative CHECK (base_points >= 0 AND bonus_points >= 0),
    CONSTRAINT point_events_points_add_up CHECK (points = base_points + bonus_points),
    CONSTRAINT point_events_focus_positive CHECK (focus_seconds > 0),
    CONSTRAINT point_events_once_per_source UNIQUE (user_id, kind, source_key)
);

-- History pages and "today" sums read one user's rows newest first.
CREATE INDEX point_events_user_earned_idx ON point_events (user_id, earned_at DESC);

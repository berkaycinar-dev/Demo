-- V9: what a person inside a room is doing, so everyone in the room sees it.
--
-- * status: IDLE (at the desk, timer stopped), FOCUS, BREAK or AWAY.
-- * break_spot / break_slot: the break spot (room furniture id, e.g. "sofa") and which of its places
--   (0, 1, ...) the person took; only while on BREAK. The server hands out the places
--   (RoomSessionService.changeStatus, under the room row lock), so every screen shows each person in
--   the same place and two people sent at the same moment cannot take the same one. The unique index
--   below is a second guard.
-- * status_since: when the current status started (away for N minutes, on break since ...).
-- * seat: which desk seat (0-based) the person sits at. Given on enter (lowest free seat, under the room
--   row lock) and kept for the whole visit, so everyone sees each person at the same desk and nobody
--   moves when someone leaves. NULL only for sessions opened before V9.

ALTER TABLE room_sessions
    ADD COLUMN seat         integer,
    ADD COLUMN status       varchar(10) NOT NULL DEFAULT 'IDLE',
    ADD COLUMN break_spot   varchar(40),
    ADD COLUMN break_slot   integer,
    ADD COLUMN status_since timestamptz NOT NULL DEFAULT now(),
    ADD CONSTRAINT room_sessions_status_valid CHECK (status IN ('IDLE', 'FOCUS', 'BREAK', 'AWAY')),
    ADD CONSTRAINT room_sessions_spot_only_on_break CHECK (break_spot IS NULL OR status = 'BREAK'),
    ADD CONSTRAINT room_sessions_slot_with_spot CHECK ((break_slot IS NULL) = (break_spot IS NULL) AND (break_slot IS NULL OR break_slot BETWEEN 0 AND 7));

-- One person per seat among the people inside the room now.
CREATE UNIQUE INDEX room_sessions_one_per_seat_key ON room_sessions (room_id, seat)
    WHERE ended_at IS NULL AND seat IS NOT NULL;

-- One person per place of a break spot among the people inside the room now.
CREATE UNIQUE INDEX room_sessions_one_per_place_key ON room_sessions (room_id, break_spot, break_slot)
    WHERE ended_at IS NULL AND break_spot IS NOT NULL;

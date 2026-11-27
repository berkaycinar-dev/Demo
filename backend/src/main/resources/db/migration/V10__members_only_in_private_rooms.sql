-- V10: membership only in private (invite) rooms.
--
-- * Public rooms have no members: people enter, work and leave (room_sessions). Who owns the room is
--   rooms.owner_id. So the membership rows of public rooms go away.
-- * A private room's member keeps a desk seat while they are a member: inside they sit there, and when
--   they are not inside (closed the app, in another room) they are shown at that seat as away.
--   Existing members get seats in the order they joined.

DELETE FROM room_members m USING rooms r WHERE m.room_id = r.id AND r.visibility = 'PUBLIC';

ALTER TABLE room_members ADD COLUMN seat integer;

UPDATE room_members m
SET seat = numbered.n - 1
FROM (SELECT id, row_number() OVER (PARTITION BY room_id ORDER BY joined_at, id) AS n FROM room_members) numbered
WHERE numbered.id = m.id;

ALTER TABLE room_members
    ALTER COLUMN seat SET NOT NULL,
    ADD CONSTRAINT room_members_seat_range CHECK (seat BETWEEN 0 AND 9);

CREATE UNIQUE INDEX room_members_one_per_seat_key ON room_members (room_id, seat);

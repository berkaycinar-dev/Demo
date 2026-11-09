-- Rooms and who belongs to them (H3).
-- Roles live here, not in the JWT, so a role change applies at once.
-- Exactly one OWNER per room (the creator). PRIVATE rooms have an invite code, PUBLIC rooms do not.

CREATE TABLE rooms (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        varchar(60)  NOT NULL,
    description varchar(200),
    visibility  varchar(10)  NOT NULL DEFAULT 'PUBLIC',
    invite_code varchar(16),
    max_members integer      NOT NULL DEFAULT 8,
    owner_id    uuid         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at  timestamptz  NOT NULL DEFAULT now(),
    updated_at  timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT rooms_name_not_blank   CHECK (length(btrim(name)) > 0),
    CONSTRAINT rooms_visibility_valid CHECK (visibility IN ('PUBLIC', 'PRIVATE')),
    CONSTRAINT rooms_max_members_range CHECK (max_members BETWEEN 2 AND 10),
    CONSTRAINT rooms_invite_matches_visibility CHECK ((visibility = 'PRIVATE') = (invite_code IS NOT NULL))
);

CREATE UNIQUE INDEX rooms_invite_code_key ON rooms (invite_code);
CREATE INDEX rooms_owner_idx ON rooms (owner_id);
CREATE INDEX rooms_public_newest_idx ON rooms (created_at DESC) WHERE visibility = 'PUBLIC';

CREATE TRIGGER rooms_set_updated_at BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE room_members (
    id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id   uuid        NOT NULL REFERENCES rooms (id) ON DELETE CASCADE,
    user_id   uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role      varchar(10) NOT NULL,
    joined_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT room_members_role_valid CHECK (role IN ('OWNER', 'MEMBER'))
);

CREATE UNIQUE INDEX room_members_room_user_key ON room_members (room_id, user_id);
CREATE INDEX room_members_user_idx ON room_members (user_id);
CREATE UNIQUE INDEX room_members_one_owner_key ON room_members (room_id) WHERE role = 'OWNER';

-- V2: users (H2). Used by register / login (contracts/openapi.yaml, tag "auth").
--
-- * email is stored in lower case (the service lower-cases it; the CHECK below enforces it).
-- * username keeps the case the user typed, but must be unique ignoring case.
-- * password_hash holds a BCrypt hash (60 chars). The plain password is never stored.
-- * Later migrations add what they need (refresh_tokens, email_verified_at, ...).

CREATE TABLE users (
    id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    email         varchar(254) NOT NULL,
    username      varchar(30)  NOT NULL,
    password_hash varchar(100) NOT NULL,
    created_at    timestamptz  NOT NULL DEFAULT now(),
    updated_at    timestamptz  NOT NULL DEFAULT now(),

    CONSTRAINT users_email_lowercase CHECK (email = lower(email)),
    CONSTRAINT users_email_has_at    CHECK (position('@' IN email) > 1),
    CONSTRAINT users_username_format CHECK (username ~ '^[A-Za-z0-9_]{3,30}$')
);

CREATE UNIQUE INDEX users_email_key          ON users (email);
CREATE UNIQUE INDEX users_username_lower_key ON users (lower(username));

-- set_updated_at() comes from V1.
CREATE TRIGGER users_set_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

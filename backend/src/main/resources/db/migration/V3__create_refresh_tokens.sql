-- V3: refresh tokens (H2). Used by /api/v1/auth/refresh and /api/v1/auth/logout.
--
-- * The token itself is never stored, only its SHA-256 hash (64 hex characters).
-- * A token works once: used_at is set when it is exchanged for a new pair.
--   Presenting a used token again revokes all tokens of that user.
-- * revoked_at is set by logout (or by the reuse rule above).
-- * varchar(64), not char(64): Hibernate's schema validation expects varchar for a String field.

CREATE TABLE refresh_tokens (
    id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash varchar(64) NOT NULL,
    expires_at timestamptz NOT NULL,
    used_at    timestamptz,
    revoked_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX refresh_tokens_hash_key ON refresh_tokens (token_hash);
CREATE INDEX refresh_tokens_user_idx ON refresh_tokens (user_id);

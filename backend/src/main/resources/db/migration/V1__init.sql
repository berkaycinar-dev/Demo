-- V1: baseline migration.
--
-- Rules for every migration file in this folder:
--   * Name: V<number>__<description>.sql  (two underscores), e.g. V2__create_users.sql
--   * Never edit a file after it was merged to main; Flyway stores its checksum.
--     To change a table, add a new file (V3__add_column_x.sql).
--
-- Planned order: V2 users (H2), V3 rooms (H3), V4 room_sessions (H4),
--                V5 timer_states (H5), V6 point_events (H6).

-- Shared helper used by later tables: keeps updated_at current on every UPDATE.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

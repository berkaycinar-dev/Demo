-- Personal Pomodoro timer (H5).
-- timer_states: one row per user. The server does not tick: it stores ends_at while RUNNING and
--   works the rest out when the timer is read or a command arrives.
-- timer_commands: remembers each command id for a while, so a retried command (lost response) is
--   answered with its first result and is not applied twice. Old rows are deleted by a background job.

CREATE TABLE timer_states (
    user_id                uuid PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    preset                 varchar(10) NOT NULL DEFAULT '25-5',
    phase                  varchar(10) NOT NULL DEFAULT 'FOCUS',
    status                 varchar(10) NOT NULL DEFAULT 'IDLE',
    ends_at                timestamptz,
    remaining_seconds      integer     NOT NULL,
    version                bigint      NOT NULL DEFAULT 0,
    completed_focus_blocks integer     NOT NULL DEFAULT 0,
    created_at             timestamptz NOT NULL DEFAULT now(),
    updated_at             timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT timer_states_preset_valid CHECK (preset IN ('25-5', '50-10', '90-15')),
    CONSTRAINT timer_states_phase_valid CHECK (phase IN ('FOCUS', 'BREAK')),
    CONSTRAINT timer_states_status_valid CHECK (status IN ('IDLE', 'RUNNING', 'PAUSED')),
    CONSTRAINT timer_states_ends_at_only_running CHECK ((status = 'RUNNING') = (ends_at IS NOT NULL)),
    CONSTRAINT timer_states_idle_is_focus CHECK (status <> 'IDLE' OR phase = 'FOCUS'),
    CONSTRAINT timer_states_remaining_positive CHECK (remaining_seconds > 0),
    CONSTRAINT timer_states_version_not_negative CHECK (version >= 0),
    CONSTRAINT timer_states_blocks_not_negative CHECK (completed_focus_blocks >= 0)
);

CREATE TRIGGER timer_states_set_updated_at BEFORE UPDATE ON timer_states
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE timer_commands (
    id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    command_id             uuid        NOT NULL,
    type                   varchar(12) NOT NULL,
    -- The state right after the command, so a repeated command gets the same answer.
    resulting_version      bigint      NOT NULL,
    preset                 varchar(10) NOT NULL,
    phase                  varchar(10) NOT NULL,
    status                 varchar(10) NOT NULL,
    ends_at                timestamptz,
    remaining_seconds      integer     NOT NULL,
    completed_focus_blocks integer     NOT NULL,
    created_at             timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT timer_commands_type_valid
        CHECK (type IN ('START', 'PAUSE', 'RESUME', 'SKIP', 'RESET', 'SET_PRESET'))
);

CREATE UNIQUE INDEX timer_commands_user_command_key ON timer_commands (user_id, command_id);
CREATE INDEX timer_commands_created_idx ON timer_commands (created_at);

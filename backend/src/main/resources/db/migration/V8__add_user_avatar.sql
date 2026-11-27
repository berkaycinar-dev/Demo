-- V8: the look of a user's avatar, so people in a room see the same avatar the owner designed.
--
-- * avatar holds a flat JSON object written by the app (AvatarRules checks it first): option ids such as
--   {"body":"female","hairStyle":"bun",...}. The backend does not know the option lists; the frontend does.
-- * NULL means the user never saved one. The frontend then draws a default.

ALTER TABLE users
    ADD COLUMN avatar text,
    ADD CONSTRAINT users_avatar_length CHECK (avatar IS NULL OR char_length(avatar) <= 4096);

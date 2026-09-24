-- Refresh PostgREST after LifeDue schema changes.
-- This prevents stale schema-cache errors after adding optional AI fields.
notify pgrst, 'reload schema';

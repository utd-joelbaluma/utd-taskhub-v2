-- Migrate sprints from Mon-Sun (7d) to Mon-Fri (5d) workweek.
-- Idempotent: only adjusts rows still on the legacy 6-day span.

UPDATE public.sprints
SET end_date = start_date + INTERVAL '4 days'
WHERE end_date = start_date + INTERVAL '6 days';

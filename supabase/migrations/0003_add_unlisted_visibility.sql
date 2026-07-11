-- PostgreSQL requires a newly added enum value to commit before later migrations use it.
ALTER TYPE visibility ADD VALUE IF NOT EXISTS 'unlisted';

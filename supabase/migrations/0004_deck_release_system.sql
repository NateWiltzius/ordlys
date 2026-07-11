-- Staged, data-preserving deck release migration. Safe to retry.
CREATE SCHEMA IF NOT EXISTS private;
DO $$ BEGIN CREATE TYPE deck_status AS ENUM ('active','archived','deleted','moderation_removed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE copy_policy AS ENUM ('follow_only','private_forks','public_forks'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE catalog_status AS ENUM ('eligible','duplicate','hidden','under_review'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE follow_update_mode AS ENUM ('automatic','manual'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE follow_status AS ENUM ('active','unfollowed','frozen'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE decks ALTER COLUMN visibility SET DEFAULT 'private';
ALTER TABLE decks ADD COLUMN IF NOT EXISTS status deck_status NOT NULL DEFAULT 'active';
ALTER TABLE decks ADD COLUMN IF NOT EXISTS copy_policy copy_policy NOT NULL DEFAULT 'follow_only';
ALTER TABLE decks ADD COLUMN IF NOT EXISTS catalog_status catalog_status NOT NULL DEFAULT 'eligible';
ALTER TABLE decks ADD COLUMN IF NOT EXISTS root_deck_id integer REFERENCES decks(id);
ALTER TABLE decks ADD COLUMN IF NOT EXISTS source_release_id integer;
ALTER TABLE decks ADD COLUMN IF NOT EXISTS current_release_id integer;
ALTER TABLE decks ADD COLUMN IF NOT EXISTS retention_until timestamp;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS current_revision_id integer;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS removed_at timestamp;
ALTER TABLE vocabs ADD COLUMN IF NOT EXISTS root_vocab_id integer REFERENCES vocabs(id);
ALTER TABLE vocabs ADD COLUMN IF NOT EXISTS current_revision_id integer;
ALTER TABLE vocabs ADD COLUMN IF NOT EXISTS removed_at timestamp;

CREATE TABLE IF NOT EXISTS lesson_revisions (id serial PRIMARY KEY, lesson_id integer NOT NULL REFERENCES lessons(id), title varchar(255) NOT NULL, creator_id uuid NOT NULL, created_at timestamp NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS vocab_revisions (id serial PRIMARY KEY, vocab_id integer NOT NULL REFERENCES vocabs(id), front varchar(255) NOT NULL, back varchar(255) NOT NULL, front_alternatives varchar(255)[] NOT NULL DEFAULT ARRAY[]::varchar[], back_alternatives varchar(255)[] NOT NULL DEFAULT ARRAY[]::varchar[], reading varchar(255), tags varchar(64)[] NOT NULL DEFAULT ARRAY[]::varchar[], metadata jsonb NOT NULL DEFAULT '{}', notes text, creator_id uuid NOT NULL, created_at timestamp NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS deck_releases (id serial PRIMARY KEY, deck_id integer NOT NULL REFERENCES decks(id), version integer NOT NULL, title varchar(255) NOT NULL, description varchar(255), copy_policy copy_policy NOT NULL, content_hash varchar(64) NOT NULL, change_summary text NOT NULL, derived_from_release_id integer REFERENCES deck_releases(id), creator_id uuid NOT NULL, created_at timestamp NOT NULL DEFAULT now(), UNIQUE(deck_id,version));
CREATE TABLE IF NOT EXISTS release_lessons (release_id integer NOT NULL REFERENCES deck_releases(id), lesson_id integer NOT NULL REFERENCES lessons(id), revision_id integer NOT NULL REFERENCES lesson_revisions(id), order_index integer NOT NULL, UNIQUE(release_id,lesson_id));
CREATE TABLE IF NOT EXISTS release_vocabs (release_id integer NOT NULL REFERENCES deck_releases(id), lesson_id integer NOT NULL REFERENCES lessons(id), vocab_id integer NOT NULL REFERENCES vocabs(id), revision_id integer NOT NULL REFERENCES vocab_revisions(id), order_index integer NOT NULL, UNIQUE(release_id,vocab_id));
CREATE TABLE IF NOT EXISTS deck_follows (id serial PRIMARY KEY, user_id uuid NOT NULL, deck_id integer NOT NULL REFERENCES decks(id), update_mode follow_update_mode NOT NULL DEFAULT 'automatic', pinned_release_id integer REFERENCES deck_releases(id), last_seen_release_id integer REFERENCES deck_releases(id), status follow_status NOT NULL DEFAULT 'active', followed_at timestamp NOT NULL DEFAULT now(), unfollowed_at timestamp, UNIQUE(user_id,deck_id));
CREATE TABLE IF NOT EXISTS deck_audit_events (id serial PRIMARY KEY, deck_id integer REFERENCES decks(id), actor_id uuid, event_type varchar(64) NOT NULL, metadata jsonb NOT NULL DEFAULT '{}', idempotency_key varchar(128), created_at timestamp NOT NULL DEFAULT now(), UNIQUE(actor_id,event_type,idempotency_key));
CREATE TABLE IF NOT EXISTS deck_reports (id serial PRIMARY KEY, deck_id integer NOT NULL REFERENCES decks(id), reporter_id uuid NOT NULL, reason varchar(64) NOT NULL, details text, created_at timestamp NOT NULL DEFAULT now(), UNIQUE(reporter_id,deck_id));

-- Stable IDs are preserved; backfills only fill missing revision pointers.
INSERT INTO lesson_revisions(lesson_id,title,creator_id)
SELECT l.id,l.title,d.owner_id FROM lessons l JOIN decks d ON d.id=l.deck_id WHERE l.current_revision_id IS NULL AND NOT EXISTS (SELECT 1 FROM lesson_revisions r WHERE r.lesson_id=l.id);
UPDATE lessons l SET current_revision_id=r.id FROM (SELECT DISTINCT ON (lesson_id) id,lesson_id FROM lesson_revisions ORDER BY lesson_id,id) r WHERE l.id=r.lesson_id AND l.current_revision_id IS NULL;
INSERT INTO vocab_revisions(vocab_id,front,back,front_alternatives,back_alternatives,reading,tags,metadata,notes,creator_id)
SELECT v.id,v.front,v.back,v.front_alternatives,v.back_alternatives,v.reading,v.tags,v.metadata,v.notes,d.owner_id FROM vocabs v JOIN lessons l ON l.id=v.lesson_id JOIN decks d ON d.id=l.deck_id WHERE v.current_revision_id IS NULL AND NOT EXISTS (SELECT 1 FROM vocab_revisions r WHERE r.vocab_id=v.id);
UPDATE vocabs v SET current_revision_id=r.id,root_vocab_id=coalesce(v.root_vocab_id,v.id) FROM (SELECT DISTINCT ON (vocab_id) id,vocab_id FROM vocab_revisions ORDER BY vocab_id,id) r WHERE v.id=r.vocab_id AND v.current_revision_id IS NULL;
UPDATE decks SET root_deck_id=id WHERE root_deck_id IS NULL;

-- Release 1 uses pgcrypto digest; Supabase provides this extension.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE OR REPLACE FUNCTION private.stable_json(value jsonb) RETURNS text
LANGUAGE plpgsql IMMUTABLE STRICT AS $$
BEGIN
  CASE jsonb_typeof(value)
    WHEN 'object' THEN
      RETURN (SELECT '{' || coalesce(string_agg(to_jsonb(key)::text || ':' || private.stable_json(item), ',' ORDER BY key COLLATE "C"), '') || '}' FROM jsonb_each(value) entry(key,item));
    WHEN 'array' THEN
      RETURN (SELECT '[' || coalesce(string_agg(private.stable_json(item), ',' ORDER BY ordinal), '') || ']' FROM jsonb_array_elements(value) WITH ORDINALITY entry(item,ordinal));
    WHEN 'string' THEN RETURN to_jsonb(value #>> '{}')::text;
    ELSE RETURN value::text;
  END CASE;
END $$;
INSERT INTO deck_releases(deck_id,version,title,description,copy_policy,content_hash,change_summary,creator_id)
SELECT d.id,1,d.title,d.description,d.copy_policy,encode(digest(private.stable_json(jsonb_build_object(
  'lessons',coalesce((SELECT jsonb_agg(jsonb_build_object(
    'title',lr.title,'order',l.order_index,'vocabs',coalesce((SELECT jsonb_agg(jsonb_build_object(
      'front',vr.front,'back',vr.back,'frontAlternatives',vr.front_alternatives,
      'backAlternatives',vr.back_alternatives,'reading',vr.reading,'tags',vr.tags,
      'metadata',vr.metadata,'notes',vr.notes,'order',v.order_index
    ) ORDER BY v.order_index,v.id) FROM vocabs v JOIN vocab_revisions vr ON vr.id=v.current_revision_id
      WHERE v.lesson_id=l.id AND v.removed_at IS NULL),'[]'::jsonb)
  ) ORDER BY l.order_index,l.id) FROM lessons l JOIN lesson_revisions lr ON lr.id=l.current_revision_id
    WHERE l.deck_id=d.id AND l.removed_at IS NULL),'[]'::jsonb)
)),'sha256'),'hex'),'Initial migrated release',d.owner_id
FROM decks d WHERE NOT EXISTS (SELECT 1 FROM deck_releases r WHERE r.deck_id=d.id);
INSERT INTO release_lessons SELECT r.id,l.id,l.current_revision_id,l.order_index FROM deck_releases r JOIN lessons l ON l.deck_id=r.deck_id WHERE r.version=1 ON CONFLICT DO NOTHING;
INSERT INTO release_vocabs SELECT r.id,v.lesson_id,v.id,v.current_revision_id,v.order_index FROM deck_releases r JOIN lessons l ON l.deck_id=r.deck_id JOIN vocabs v ON v.lesson_id=l.id WHERE r.version=1 ON CONFLICT DO NOTHING;
UPDATE decks d SET current_release_id=r.id FROM deck_releases r WHERE r.deck_id=d.id AND r.version=1 AND d.current_release_id IS NULL;
WITH RECURSIVE lineage AS (
  SELECT id, id AS root_id FROM decks WHERE source_deck_id IS NULL
  UNION ALL
  SELECT child.id, parent.root_id FROM decks child JOIN lineage parent ON child.source_deck_id=parent.id
)
UPDATE decks d SET root_deck_id=lineage.root_id FROM lineage WHERE d.id=lineage.id;
UPDATE decks child SET source_release_id=source.current_release_id
FROM decks source WHERE child.source_deck_id=source.id AND child.source_release_id IS NULL;
INSERT INTO deck_follows(user_id,deck_id,last_seen_release_id) SELECT s.user_id,s.deck_id,d.current_release_id FROM deck_subscriptions s JOIN decks d ON d.id=s.deck_id ON CONFLICT(user_id,deck_id) DO NOTHING;

DO $$ BEGIN ALTER TABLE decks ADD CONSTRAINT decks_source_release_id_fk FOREIGN KEY(source_release_id) REFERENCES deck_releases(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE decks ADD CONSTRAINT decks_current_release_id_fk FOREIGN KEY(current_release_id) REFERENCES deck_releases(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE lessons ADD CONSTRAINT lessons_current_revision_id_fk FOREIGN KEY(current_revision_id) REFERENCES lesson_revisions(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE vocabs ADD CONSTRAINT vocabs_current_revision_id_fk FOREIGN KEY(current_revision_id) REFERENCES vocab_revisions(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION private.can_view_deck(target_deck_id integer) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM decks d WHERE d.id=target_deck_id AND d.status <> 'moderation_removed' AND (
    d.owner_id=auth.uid() OR (d.status='active' AND d.visibility IN ('public','unlisted')) OR EXISTS (
      SELECT 1 FROM deck_follows f WHERE f.deck_id=d.id AND f.user_id=auth.uid() AND f.status IN ('active','frozen')
    )
  ));
$$;
CREATE OR REPLACE FUNCTION private.can_study_deck(target_deck_id integer) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM decks d WHERE d.id=target_deck_id AND d.status <> 'moderation_removed' AND (
    d.owner_id=auth.uid() OR EXISTS (SELECT 1 FROM deck_follows f WHERE f.deck_id=d.id AND f.user_id=auth.uid() AND f.status IN ('active','frozen'))
  ));
$$;
CREATE OR REPLACE FUNCTION private.owns_deck(target_deck_id integer) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM decks WHERE id=target_deck_id AND owner_id=auth.uid() AND status='active');
$$;

ALTER TABLE deck_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE release_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE release_vocabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocab_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users can view accessible releases" ON deck_releases;
CREATE POLICY "users can view accessible releases" ON deck_releases FOR SELECT TO authenticated USING (private.can_view_deck(deck_id));
DROP POLICY IF EXISTS "users can view accessible release lessons" ON release_lessons;
CREATE POLICY "users can view accessible release lessons" ON release_lessons FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM deck_releases r WHERE r.id=release_id AND private.can_view_deck(r.deck_id)));
DROP POLICY IF EXISTS "users can view accessible release vocab" ON release_vocabs;
CREATE POLICY "users can view accessible release vocab" ON release_vocabs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM deck_releases r WHERE r.id=release_id AND private.can_view_deck(r.deck_id)));
DROP POLICY IF EXISTS "users can view accessible lesson revisions" ON lesson_revisions;
CREATE POLICY "users can view accessible lesson revisions" ON lesson_revisions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM lessons l WHERE l.id=lesson_id AND private.can_view_deck(l.deck_id)) OR
  EXISTS (SELECT 1 FROM release_lessons rl JOIN deck_releases r ON r.id=rl.release_id WHERE rl.revision_id=lesson_revisions.id AND private.can_view_deck(r.deck_id))
);
DROP POLICY IF EXISTS "users can view accessible vocab revisions" ON vocab_revisions;
CREATE POLICY "users can view accessible vocab revisions" ON vocab_revisions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM vocabs v JOIN lessons l ON l.id=v.lesson_id WHERE v.id=vocab_id AND private.can_view_deck(l.deck_id)) OR
  EXISTS (SELECT 1 FROM release_vocabs rv JOIN deck_releases r ON r.id=rv.release_id WHERE rv.revision_id=vocab_revisions.id AND private.can_view_deck(r.deck_id))
);
DROP POLICY IF EXISTS "users manage their follows" ON deck_follows;
DROP POLICY IF EXISTS "users view their follows" ON deck_follows;
CREATE POLICY "users view their follows" ON deck_follows FOR SELECT TO authenticated USING (user_id=auth.uid());
DROP POLICY IF EXISTS "users create reports" ON deck_reports;
CREATE POLICY "users create reports" ON deck_reports FOR INSERT TO authenticated WITH CHECK (reporter_id=auth.uid());

-- Domain mutations are server-only. This also prevents direct provenance or policy manipulation.
REVOKE INSERT, UPDATE, DELETE ON decks, lessons, vocabs, user_vocab_state,
  deck_releases, release_lessons, release_vocabs, lesson_revisions, vocab_revisions,
  deck_follows, deck_audit_events, deck_reports FROM authenticated, anon;
REVOKE SELECT ON decks, lessons, vocabs, user_vocab_state, deck_subscriptions,
  deck_releases, release_lessons, release_vocabs, lesson_revisions, vocab_revisions,
  deck_follows, deck_audit_events, deck_reports FROM authenticated, anon;

CREATE INDEX IF NOT EXISTS deck_releases_hash_idx ON deck_releases(content_hash);
CREATE INDEX IF NOT EXISTS lesson_revisions_lesson_id_idx ON lesson_revisions(lesson_id);
CREATE INDEX IF NOT EXISTS vocab_revisions_vocab_id_idx ON vocab_revisions(vocab_id);
CREATE INDEX IF NOT EXISTS deck_follows_deck_status_idx ON deck_follows(deck_id,status);
CREATE INDEX IF NOT EXISTS deck_follows_user_status_idx ON deck_follows(user_id,status);
CREATE INDEX IF NOT EXISTS release_lessons_release_order_idx ON release_lessons(release_id,order_index);
CREATE INDEX IF NOT EXISTS release_vocabs_release_lesson_order_idx ON release_vocabs(release_id,lesson_id,order_index);

CREATE OR REPLACE FUNCTION private.reject_immutable_release_change() RETURNS trigger
LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'immutable release data cannot be changed'; END $$;
DROP TRIGGER IF EXISTS immutable_deck_releases ON deck_releases;
CREATE TRIGGER immutable_deck_releases BEFORE UPDATE OR DELETE ON deck_releases FOR EACH ROW EXECUTE FUNCTION private.reject_immutable_release_change();
DROP TRIGGER IF EXISTS immutable_release_lessons ON release_lessons;
CREATE TRIGGER immutable_release_lessons BEFORE UPDATE OR DELETE ON release_lessons FOR EACH ROW EXECUTE FUNCTION private.reject_immutable_release_change();
DROP TRIGGER IF EXISTS immutable_release_vocabs ON release_vocabs;
CREATE TRIGGER immutable_release_vocabs BEFORE UPDATE OR DELETE ON release_vocabs FOR EACH ROW EXECUTE FUNCTION private.reject_immutable_release_change();
DROP TRIGGER IF EXISTS immutable_lesson_revisions ON lesson_revisions;
CREATE TRIGGER immutable_lesson_revisions BEFORE UPDATE OR DELETE ON lesson_revisions FOR EACH ROW EXECUTE FUNCTION private.reject_immutable_release_change();
DROP TRIGGER IF EXISTS immutable_vocab_revisions ON vocab_revisions;
CREATE TRIGGER immutable_vocab_revisions BEFORE UPDATE OR DELETE ON vocab_revisions FOR EACH ROW EXECUTE FUNCTION private.reject_immutable_release_change();

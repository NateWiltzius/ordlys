# Ordlys Norwegian Wedge Plan

Last updated: 2026-07-26  
Status: Direction approved; implementation not started  
Owner: Ordlys

## Purpose

This document is the durable source of truth for turning Ordlys into a Norwegian-focused product
without removing its generic flashcard capabilities.

Update this document whenever a phase changes status, a material product decision is made, or a
session ends with unfinished work. Do not rely on chat history alone.

## Product direction

Ordlys remains a generic spaced-repetition flashcard platform technically, but initially becomes a
Norwegian-learning product commercially.

The initial positioning is:

> Ordlys helps adult Bokmål learners remember the Norwegian they encounter in Duolingo, classes,
> and daily life.

Ordlys is a retention and vocabulary-practice layer around a learner's existing Norwegian study. It
is not initially positioned as a complete Norwegian course, an official CEFR vocabulary authority,
or a guarantee of Norskprøven success.

### Initial target user

The first target user is an English-speaking adult Bokmål learner at beginner or A1-A2 level who:

- uses Duolingo, attends a Norwegian class, lives in Norway, or is preparing to move there;
- recognizes vocabulary during lessons but struggles to recall it later;
- needs help with noun gender, acceptable forms, ambiguous translations, and active recall;
- wants more guidance than Anki without starting another complete language course.

## Product principles

1. Norwegian is the acquisition wedge, not a technical constraint.
2. Generic deck creation, import, export, sharing, and study remain supported.
3. Existing users are never automatically enrolled in Norwegian content.
4. A learning path is a guided sequence; a deck is a study unit; a collection is user organization.
5. Official Ordlys content is visibly separate from community content.
6. Content depth and trust matter more than the total number of cards.
7. Reviews for material a learner has already started should not be blocked by a paywall.
8. Early path behavior may be configured in code before a permanent path-management system exists.
9. Avoid claims such as "all A1 vocabulary" or "official Norskprøven vocabulary."
10. Preserve stable progress and URLs whenever the data model evolves.

## Current baseline

Snapshot from 2026-07-26:

- 9 active public decks;
- 7,456 active cards;
- Norwegian A1, A2, B1, B2, C1, and C2 decks;
- Duolingo Norwegian Sections 1, 2, and 3;
- 798 repeated Norwegian front-form instances across active decks;
- 155 overlapping front forms between Norwegian A1 and Duolingo Section 2;
- no active cards using notes, tags, or structured metadata;
- a small early user cohort, insufficient for reliable retention or willingness-to-pay conclusions.

### Current strengths

- Complete learn and review loop.
- Typed recall in both directions.
- Accepted alternatives, hints, and manual overrides.
- Lessons and lesson progression.
- Progress reporting and review forecasting.
- Public, unlisted, and private decks.
- Deck following, copying, releases, and immutable revision history.
- CSV import and export.
- Responsive authenticated web application.

### Current weaknesses

- The public positioning is generic and does not communicate a strong user outcome.
- New users must assemble their own learning journey from separate decks.
- Norwegian content is broad but mostly shallow.
- Official and community content do not have a strong trust distinction.
- Progress is tied to deck-local vocabulary IDs, so shared concepts can become duplicate memories.
- There is no intentional Norwegian onboarding or path-level "Continue" action.
- There is no clear paid value boundary.

## Compatibility contract for generic users

The Norwegian wedge must not remove or degrade the existing generic workflow.

Generic users retain:

- all existing decks and study progress;
- Today, Library, and Progress behavior;
- deck creation and CSV import/export;
- public, private, and unlisted sharing;
- direct deck URLs and bookmarks;
- the ability to study any language or subject;
- access to reviews for cards they already study.

Existing users are not shown a Norwegian continuation action unless they explicitly enroll in a
Norwegian path.

New-user onboarding will eventually offer two explicit routes:

1. Learn Norwegian.
2. Study my own material.

## Rollout and feature-flag strategy

The wedge should launch behind a small set of centralized release flags. A feature flag controls
whether unfinished functionality is available; it must not become the permanent way the product
decides whether a user is a Norwegian or generic learner.

The permanent distinction is an experience preference:

```text
experience mode: Norwegian | custom
```

Existing accounts default to `custom` unless they explicitly start a Norwegian path. New accounts
choose a route during onboarding. A learner may use Norwegian paths and generic decks together, so
experience mode controls emphasis rather than access.

### Initial release flags

- `norwegianWedgeHomepage`: enables the Norwegian-focused public homepage.
- `norwegianLearningPaths`: enables public path pages and path start actions.
- `norwegianOnboarding`: enables the Norwegian-versus-custom route choice for new accounts.
- `norwegianPathDashboard`: enables path continuation on Today for enrolled users.

Keep flag evaluation in one typed server-side module rather than reading environment variables
throughout components. Every flag should have an owner, default value, rollout audience, removal
condition, and intended expiry.

### Rollout order

1. Developers and explicitly allowlisted preview accounts.
2. Public path pages at direct URLs, with the generic homepage unchanged.
3. A small, stable cohort of new visitors or accounts.
4. All new visitors, while existing accounts remain in their current experience.
5. Existing users receive an optional Norwegian entry point.
6. Remove temporary flags after the experience is stable and the generic fallback is verified.

Do not use an unrestricted query parameter as the production preview mechanism. Prefer deployment
configuration, an authenticated operator allowlist, or a signed preview cookie.

### Safety requirements

- Every flagged page or component has a working generic fallback.
- Disabling a flag never hides or deletes user data.
- Additive database migrations deploy before code that can use them.
- Rollback is performed by disabling presentation and enrollment behavior, not reverting user
  progress.
- Analytics record the assigned experience and flag variant.
- Automated tests cover flags both enabled and disabled.
- Search metadata and canonical URLs remain intentional when homepage variants coexist.
- Flags do not control core review correctness, SRS state, authorization, or data ownership.

## Product concepts

### Learning path

An Ordlys- or publisher-curated sequence with a goal, order, starting point, and path-level
progress. Examples:

- Norwegian foundations.
- Duolingo Norwegian companion.

Initial implementation:

```text
Path -> ordered decks -> existing lessons -> cards
```

### Deck

An atomic package of lessons and cards. Decks remain the core generic SRS content structure.

### Collection

A private or shareable user-created grouping of decks. Collections provide organization, not
pedagogical guarantees. Do not build general collection tooling until user demand is demonstrated.

### Publisher

The identity responsible for curated content. Long term, official Ordlys content should belong to
an Ordlys publisher rather than a fake or ordinary user account.

### Canonical learning item

A stable, sense-aware vocabulary identity that can appear in multiple official paths or decks while
sharing user progress. Do not deduplicate solely by visible text because one Norwegian form can have
multiple meanings.

## Intended product surfaces

### Logged-out homepage

Primary message: remember the Norwegian you learn.

Primary actions:

1. Start Norwegian foundations.
2. Use the Duolingo companion.

Secondary action:

- Create flashcards for something else.

The homepage should demonstrate a Norwegian-specific advantage such as gender, forms, accepted
variants, context, or explanation rather than only explaining SRS.

### Signed-in navigation

Likely target:

- Today
- Learn
- Library
- Progress

`Learn` contains curated Norwegian paths. `Library` retains followed and user-created decks.
Generic users can ignore Learn without losing functionality.

### Today

Today should answer:

1. What should I review?
2. What should I learn next?

An enrolled path adds a prominent continuation action. Reviews may remain aggregated across paths,
followed decks, and owned decks.

## Phase status summary

| Phase | Name                                  | Status      |
| ----- | ------------------------------------- | ----------- |
| 0     | Baseline, guardrails, and measurement | In progress |
| 1     | Minimal Norwegian wedge               | Not started |
| 2     | Activation and path retention         | Not started |
| 3     | Norwegian content moat                | Not started |
| 4     | Durable publishing and path model     | Not started |
| 5     | Monetization and distribution         | Not started |
| 6     | Expansion                             | Not started |

## Phase 0: Baseline, guardrails, and measurement

Goal: establish what must be preserved and how the wedge will be evaluated.

### Work

- [ ] Record current route, deck, and study-flow behavior that generic users depend on.
- [ ] Define product analytics events and privacy-safe properties.
- [ ] Establish a pre-change funnel baseline where possible.
- [ ] Add a lightweight content-quality audit for official decks.
- [ ] Review Duolingo naming, trademark, and content-source risks before paid promotion.
- [ ] Replace or schedule replacement of indefensible "all vocabulary" claims.
- [ ] Decide which current decks are shown as official, experimental, hidden, or community content.
- [x] Add a typed, centralized release-flag module with safe defaults and documented removal
      conditions.
- [ ] Define preview allowlisting and stable cohort assignment.

### Initial analytics events

- `homepage_primary_cta_clicked`
- `learning_route_selected`
- `path_viewed`
- `path_started`
- `first_session_started`
- `first_session_completed`
- `first_review_became_due`
- `first_review_completed`
- `path_unit_completed`
- `personal_deck_created`
- `deck_imported`
- `upgrade_viewed`
- `checkout_started`
- `subscription_started`

Useful dimensions:

- selected route: Norwegian or custom;
- path slug;
- starting level or section;
- new versus returning account;
- owned, followed, or path-sourced study content.
- assigned experience mode and relevant release-flag variants.

Do not send card answers or personally identifying vocabulary content to analytics.

### Exit criteria

- Compatibility contract is reflected in tests or documented manual checks.
- Funnel events are defined and the most important activation events are measurable.
- Official content shown in the first wedge release is explicitly selected.
- High-risk marketing claims are removed or rewritten.
- Flag-off behavior preserves the current generic experience.
- Preview and cohort assignment are stable across sessions and devices where appropriate.

## Phase 1: Minimal Norwegian wedge

Goal: test Norwegian positioning and guided organization without a large schema rewrite.

### Work

- [ ] Rewrite homepage metadata, hero, sections, and calls to action around Norwegian retention.
- [ ] Keep the homepage rewrite behind `norwegianWedgeHomepage` until rollout criteria are met.
- [ ] Keep a visible secondary route for generic flashcard users.
- [ ] Add a Norwegian learning landing page.
- [ ] Keep path start actions behind `norwegianLearningPaths`.
- [ ] Define initial learning paths in a typed application configuration.
- [ ] Add a path page with ordered decks, units, and a single start/continue action.
- [ ] Group A1 content under Norwegian foundations.
- [ ] Group Duolingo Sections 1-3 under an independent companion path.
- [ ] Add an independence disclaimer and avoid Duolingo visual branding.
- [ ] Keep existing Library, Discover, and deck routes operational.
- [ ] Update SEO metadata and sitemap entries for Norwegian intent.
- [ ] Add tests for path configuration, path routing, and generic compatibility.

### Proposed initial path configuration

The actual database IDs must not be hard-coded without validation in each environment. Prefer
stable slugs or a mapping layer.

```ts
type LearningPathDefinition = {
  slug: string;
  title: string;
  description: string;
  deckSlugs: string[];
};

const learningPaths: LearningPathDefinition[] = [
  {
    slug: 'norwegian-foundations',
    title: 'Norwegian foundations',
    description: 'Build a practical Bokmål vocabulary foundation.',
    deckSlugs: ['norwegian-a1'],
  },
  {
    slug: 'duolingo-norwegian-companion',
    title: 'Duolingo Norwegian companion',
    description: 'Remember vocabulary encountered in the Norwegian course.',
    deckSlugs: [
      'duolingo-norwegian-section-1',
      'duolingo-norwegian-section-2',
      'duolingo-norwegian-section-3',
    ],
  },
];
```

### Exit criteria

- A logged-out learner can understand the Norwegian value proposition without knowing what SRS is.
- A new visitor can start the first Norwegian lesson through one primary path.
- A generic user can still create, import, follow, and study a non-Norwegian deck.
- No existing user is automatically enrolled in Norwegian content.
- Path-view-to-session-start conversion is measurable.

## Phase 2: Activation and path retention

Goal: make the first session and first return review obvious.

### Work

- [ ] Add the "Learn Norwegian" versus "Study my own material" route choice.
- [ ] Add path enrollment state and a primary active path.
- [ ] Add a clear current unit and "Continue" action.
- [ ] Show path continuation on Today only for enrolled users.
- [ ] Preserve aggregated reviews across paths and ordinary decks.
- [ ] Offer a starting-point selector or short placement experience.
- [ ] Reduce decisions before the first five-card session.
- [ ] Evaluate guest/local first-session progress before requiring account creation.
- [ ] Add first-review reminders only with explicit user permission.
- [ ] Interview learners who complete, abandon, and return to the first session.

### Activation definition

A provisionally activated learner:

1. selects a learning route;
2. starts a path or creates/imports a deck;
3. completes a meaningful first session;
4. returns and completes at least one due review.

### Primary metrics

- Homepage to path-view conversion.
- Path view to start conversion.
- First-session completion.
- Return for first due review.
- First due-review completion.
- Learners completing three study days in their first seven days.
- Progression into the second path unit.
- Generic-route activation compared with its pre-wedge baseline.

### Exit criteria

- New Norwegian learners have one obvious next action on every core screen.
- Existing generic behavior has not materially regressed.
- Enough learners complete a first review cycle to assess early retention.
- The largest activation drop-off has been identified with evidence.

## Phase 3: Norwegian content moat

Goal: make a small amount of official content clearly better than a generic imported word list.

### Initial scope

Prioritize the first 150-300 items in Norwegian foundations and then Duolingo Section 1. Do not
attempt to enrich all 7,456 cards at once.

### Desired content fields

- [ ] Part of speech.
- [ ] Sense-specific English meaning.
- [ ] Noun article and grammatical gender.
- [ ] Definite singular and plural forms.
- [ ] Verb infinitive, present, past, and perfect forms.
- [ ] Adjective gender and plural forms.
- [ ] Common prepositions and collocations.
- [ ] Short comprehensible example sentence.
- [ ] Example translation.
- [ ] Accepted Bokmål forms and spelling variants.
- [ ] Concise post-answer explanation.
- [ ] Audio with voice or regional variety identified.
- [ ] Editorial source, reviewer, and last-reviewed date.

### Product work

- [ ] Display forms and explanations in study feedback.
- [ ] Add sense-aware answer policies.
- [ ] Add a fast "report a content issue" flow tied to a card revision.
- [ ] Add editorial review status and quality checks.
- [ ] Add a quick personal-word capture flow for class and daily-life vocabulary.
- [ ] Measure incorrect-answer, override, and report rates by item.

### Exit criteria

- The first foundation module has a documented editorial review.
- Learners can identify a concrete Norwegian-specific benefit unavailable in a plain translation
  deck.
- Content issue and answer-override rates are measurable.
- Enriched content improves activation or retention relative to thin cards.

## Phase 4: Durable publishing and path model

Goal: replace temporary configuration with a stable model after the behavior is validated.

### Publisher model

- [ ] Add publishers with system, user, and organization types.
- [ ] Add publisher membership and editor/reviewer roles.
- [ ] Migrate official decks to an Ordlys publisher.
- [ ] Preserve existing user deck ownership and permissions.
- [ ] Display verified Ordlys content separately from community content.

### Path model

- [ ] Add learning paths with publisher, language, level, goal, status, and visibility.
- [ ] Add immutable path releases.
- [ ] Add ordered path steps referencing released decks or lessons.
- [ ] Add path enrollments and primary-path preference.
- [ ] Define how path updates affect an enrolled learner.
- [ ] Keep deck following distinct from path enrollment.

### Canonical learning items

- [ ] Design a sense-aware canonical learning-item model for official content.
- [ ] Associate deck locations with canonical items rather than duplicating learning state.
- [ ] Migrate official overlaps gradually.
- [ ] Preserve existing user SRS state.
- [ ] Do not globally deduplicate user-created cards by text.

### Collections

- [ ] Validate demand before implementing.
- [ ] If justified, add user collections as organizational groupings.
- [ ] Keep collection semantics separate from curated path progression.

### Exit criteria

- Official content no longer depends on an ordinary user account.
- Paths can be updated and released without destroying learner progress.
- Official shared concepts can appear in multiple paths without redundant reviews.
- Existing generic decks continue to work without canonical-item participation.

## Phase 5: Monetization and distribution

Goal: charge for ongoing Norwegian value after activation and retention are demonstrated.

### Provisional free offering

- First foundation module or roughly 150-200 curated items.
- Unlimited reviews for material already started.
- Basic personal deck creation and word capture.
- Import and export.
- Preview of richer official content.

### Provisional paid offering

- Full official Norwegian paths.
- Rich forms, examples, explanations, and audio.
- Full Duolingo companion progression.
- Cross-path progress and deduplication.
- Advanced review controls.
- Higher personal authoring/import allowances if limits become necessary.

### Work

- [ ] Test upgrade interest with a non-blocking pricing or feature page.
- [ ] Interview activated learners about willingness to pay and preferred billing.
- [ ] Choose subscription versus course purchase based on ongoing value delivery.
- [ ] Implement billing only after pricing and entitlement behavior are defined.
- [ ] Grandfather or explicitly protect existing generic-user capabilities.
- [ ] Create Norwegian-intent landing pages and free practice tools.
- [ ] Recruit a small founding-learner cohort.
- [ ] Test partnerships with independent Norwegian teachers.

### Initial pricing hypothesis

For research only, not a committed price:

- EUR 5.99-7.99 monthly;
- EUR 39-59 annually;
- potentially a founding annual or lifetime offer.

### Distribution pages to evaluate

- `/learn-norwegian-vocabulary`
- `/norwegian-a1-vocabulary`
- `/duolingo-norwegian-companion`
- `/norwegian-noun-gender-practice`
- `/norwegian-verb-forms`
- topic-specific public lesson previews

### Exit criteria

- Paying intent comes from activated, retained learners rather than only landing-page visitors.
- Paid access limits new premium material without trapping existing reviews.
- Generic users understand what remains free.
- At least one repeatable acquisition channel shows credible conversion.

## Phase 6: Expansion

Goal: expand only after the Norwegian wedge produces repeatable activation, retention, and revenue.

Possible directions:

- A2 and B1 depth.
- Norskprøven-adjacent vocabulary and task practice without implying an official curriculum.
- Teacher and class workflows.
- Additional learner interface languages.
- Nynorsk-specific paths.
- Swedish, Danish, or another underserved language using the same publisher/path model.
- Native mobile or expanded offline functionality.

Expansion should not begin merely because the generic platform can support it.

## Workstreams that continue across phases

### Content trust

- Maintain a documented selection methodology.
- Track sources, reviewers, and revisions.
- Separate written Bokmål from claims about a single spoken standard.
- Explain acceptable feminine/common-gender variants.

### Generic compatibility

- Test owned, followed, imported, and non-language decks after navigation and study changes.
- Never auto-enroll existing users.
- Preserve reviews, exports, and direct deck access.

### Accessibility and mobile use

- Keep study flows keyboard- and screen-reader-friendly.
- Test small-screen study sessions and virtual-keyboard behavior.
- Avoid making audio the only way to access information.

### Legal and platform risk

- Use "Duolingo" only to describe compatibility or learner context.
- Avoid Duolingo logos, mascot, visual identity, or implication of endorsement.
- Maintain an independent-product disclaimer.
- Review the provenance and permitted use of course-derived vocabulary and ordering.
- Do not make the business dependent on a third-party course structure that can change without
  notice.

## Explicit non-goals for the initial release

- Rebuilding the entire deck system.
- Creating a complete Norwegian course covering every language skill.
- Enriching all A1-C2 cards.
- Building community-authored paths.
- Building a generic playlist marketplace.
- Replacing the scheduler before activation problems are understood.
- Creating a native mobile app.
- Claiming official CEFR or Norskprøven coverage.
- Automatically merging user-created vocabulary.

## Decision log

### 2026-07-26: Adopt Norwegian as the commercial wedge

The generic SRS infrastructure remains, while acquisition, default content, and initial positioning
focus on Norwegian learners.

### 2026-07-26: Preserve generic flashcards as a first-class route

Existing generic users lose no decks, progress, or study capabilities. New users may deliberately
choose "Study my own material."

### 2026-07-26: Separate paths, decks, and collections

Paths express curated progression. Decks remain the atomic generic study unit. Collections, if
built, express user organization only.

### 2026-07-26: Validate paths before building the complete path schema

The first paths may be represented through typed application configuration. A permanent publisher
and path-release system follows evidence of use.

### 2026-07-26: Depth before breadth

The first 150-300 foundation items should become meaningfully Norwegian-specific before expanding
advanced-level content.

### 2026-07-26: Use release flags without creating separate products

Norwegian presentation, paths, onboarding, and dashboard integration roll out behind centralized
temporary flags. Existing accounts default to the custom experience. A permanent experience
preference controls emphasis, while access to generic decks remains available in either mode.

### 2026-07-26: Start with deployment-level environment flags

The first release-flag implementation uses strict server-side `true` or `false` environment values
and defaults every flag to disabled. It provides a safe deployment kill switch without introducing
a third-party flag service. Stable user cohorts and preview allowlisting remain separate future
work.

## Open decisions

- [ ] Final homepage promise and supporting copy.
- [ ] Final route and navigation names.
- [ ] Exact first foundation module contents.
- [ ] Whether the first session requires authentication.
- [ ] Audio source and dialect/voice policy.
- [ ] How much Duolingo-derived structure or content is safe and maintainable.
- [ ] Permanent publisher migration approach.
- [ ] Subscription versus one-time course purchase.
- [ ] Paid price and entitlement limits.
- [ ] Analytics implementation and consent requirements.
- [x] Initial feature-flag storage and evaluation mechanism.
- [ ] Preview allowlist and initial cohort size.

## Immediate next implementation slice

This is the recommended first contained development slice:

1. Create typed, slug-based learning-path configuration.
2. Add a Norwegian learning landing page.
3. Add public pages for Norwegian foundations and the Duolingo companion.
4. Rewrite the homepage around Norwegian retention behind its release flag.
5. Keep a visible "Study something else" route into the existing generic workflow.
6. Rewrite inaccurate public deck descriptions.
7. Add analytics for path views, starts, first-session completion, and assigned variant.
8. Add flag-on and flag-off regression tests for Library, deck creation/import, and existing study
   routes.

This slice should avoid schema changes unless a blocking requirement is discovered.

## Session handoff protocol

At the start of a future implementation session:

1. Read this document.
2. Check the phase status summary.
3. Check `Immediate next implementation slice`.
4. Inspect the current git status and preserve unrelated user changes.
5. Confirm whether any open decision blocks the selected slice.

At the end of a session:

1. Update completed checkboxes.
2. Update the phase status summary.
3. Add material decisions to the decision log.
4. Update the date at the top.
5. Replace the next implementation slice with the next smallest safe unit of work.
6. Record any known validation failures or unfinished migrations below.

## Current handoff

Phase 0 has started. The typed release-flag foundation is implemented with all Norwegian flags
disabled by default. No application surface consumes the flags yet, so current generic behavior is
unchanged.

Next recommended action: continue Phase 0 and begin Phase 1 with typed learning-path configuration.

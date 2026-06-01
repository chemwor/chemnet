# Claude Code Prompt — Add links to The Food List (restaurants)

> Paste everything below the line into Claude Code. Small, self-contained content/UX fix on the
> **flagship** site. Not part of the social-platform phases.

---

You are working in the **ChemNet** repo. Goal: **The Food List restaurants should show a website
link.** Right now the `public.restaurants` table has no link column and `src/apps/Restaurants/Restaurants.jsx`
never renders one, so restaurants on the site have no clickable link. The links exist in a repo file.

**Source of links:** `Restaurants to try a06eaef4e44f4cd4a4b4237f764968f6.csv` in the repo root.
Columns: `Name, Tags, Link` (Tags = `Try` / `Good`; `Link` is the website URL; some rows have an
empty Link — skip those). Example rows:
```
Hopdoddy,Good,https://www.hopdoddy.com/locations/cobb-atlanta
Peri Peri Grill,Good,https://theperiperigrill.com/
Burger Crush,Good,https://burgercrush.com/
F & B Atlanta,Good,https://fandbatlanta.com/
Lucky Star,Good,https://www.luckystaratl.com/
Mojave Restaurant,Good,https://mojaverestaurant.com/
```

> ⚠️ This intentionally modifies the **flagship** `public.restaurants` table (adds one nullable
> column) and populates data. That's an owner-approved content fix — the "never touch `public.*`"
> rule in `CLAUDE.md` is about the *social-platform conversion* not clobbering Eric's data, not a
> ban on Eric improving his own flagship. Adding a nullable column + filling links is safe/additive.
> Do **not** change any other `public.*` table.

## Deliverables

### 1. Migration (additive)
New timestamped file in `supabase/migrations/`:
```sql
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS link TEXT;
```
Don't edit existing migrations. (Note: `members.food_items` already has a `link` column — this just
brings the flagship table to parity.)

### 2. Render the link in the Food List UI
In `src/apps/Restaurants/Restaurants.jsx`, show `item.link` when present — in both the desktop detail
panel and the mobile detail view — styled like the Reviews app's IMDb link (e.g. a small
"Visit site ↗" anchor, `target="_blank" rel="noopener noreferrer"`, using `var(--color-accent)` or
the existing link color; don't hardcode hex). Make sure the repo layer passes `link` through:
`flagshipRepo.foodItems` must select/return the new `link` column (memberRepo already has it).

### 3. Backfill links from the CSV
Write a one-off Node script `scripts/add-restaurant-links.mjs` following the existing
`scripts/*.mjs` pattern (inlined **service_role** key, like `scripts/seed.mjs`). It must:
- Parse the CSV in the repo root.
- For each CSV row with a non-empty `Link`, find the matching `restaurants` row by **name**, matched
  **case-insensitively and trimmed** (handle the trailing spaces / quotes in the CSV, e.g. `"Yeppa "`).
- `UPDATE restaurants SET link = <url> WHERE <name matches>`.
- Print a summary: how many matched + updated, and a list of CSV names with no matching DB row (so
  Eric knows which restaurants aren't in the table yet).
- Be idempotent (safe to re-run).

> Only the restaurants currently in the table get links (today that's the handful of `Good` ones).
> That's expected — the script also reports unmatched CSV entries for later.

## Acceptance criteria
- `restaurants` has a nullable `link` column; no other `public.*` table changed.
- The Food List detail (desktop + mobile) shows a working "Visit site ↗" link when a restaurant has one.
- Running `scripts/add-restaurant-links.mjs` fills links for the matching restaurants and prints a
  matched/unmatched report; re-running it is safe.
- `npm run build` and `npm run lint` pass.

When done, summarize: the migration added, the files changed, and the matched/unmatched counts from a
dry description of the CSV (don't run it against prod yourself — Eric runs the script).

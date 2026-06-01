// One-off: backfill website links onto Eric's public.restaurants from the CSV.
// Matches CSV rows to DB rows by name (case-insensitive, trimmed). Idempotent.
//
// NOTE: this reads the service-role key from an env var rather than inlining it
// (the repo is public, so an inlined key would leak). Run it like:
//   KEY=$(supabase projects api-keys --project-ref cxbfuzqjlqipjyinhzqv -o json \
//     | jq -r '.[]|select(.name=="service_role").api_key')
//   SUPABASE_SERVICE_ROLE_KEY="$KEY" node scripts/add-restaurant-links.mjs
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const url = 'https://cxbfuzqjlqipjyinhzqv.supabase.co'
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!key) { console.error('Set SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }
const supabase = createClient(url, key)

const CSV_FILE = 'Restaurants to try a06eaef4e44f4cd4a4b4237f764968f6.csv'

// Minimal RFC-4180 parser: handles quoted fields, embedded commas/newlines, BOM.
function parseCSV(text) {
  text = text.replace(/^﻿/, '')
  const rows = []
  let field = '', row = [], inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++ } else inQuotes = false }
      else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field); rows.push(row); row = []; field = ''
    } else field += c
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows
}

const norm = (s) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase()

const rows = parseCSV(readFileSync(CSV_FILE, 'utf8'))
rows.shift() // drop header (Name, Tags, Link)

// CSV rows that actually have a link.
const withLinks = rows
  .map(r => ({ name: (r[0] || '').trim(), link: (r[2] || '').trim() }))
  .filter(r => r.name && r.link)

// Current restaurants in the DB.
const { data: restaurants, error } = await supabase.from('restaurants').select('id, name')
if (error) { console.error('Could not read restaurants:', error.message); process.exit(1) }
const byName = new Map(restaurants.map(r => [norm(r.name), r]))

let updated = 0
const unmatched = []
for (const { name, link } of withLinks) {
  const match = byName.get(norm(name))
  if (!match) { unmatched.push(name); continue }
  const { error: upErr } = await supabase.from('restaurants').update({ link }).eq('id', match.id)
  if (upErr) console.log(`ERR  ${name}: ${upErr.message}`)
  else { updated++; console.log(`linked: ${match.name} -> ${link}`) }
}

console.log(`\n${updated} of ${withLinks.length} CSV rows-with-links matched a restaurant and were updated.`)
console.log(`${unmatched.length} CSV entries have a link but no matching restaurant in the table yet:`)
for (const n of unmatched) console.log(`  - ${n}`)
console.log('\ndone (safe to re-run)')

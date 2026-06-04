// Seed public.travel_log from Eric's former local-JS trips (Trips.jsx).
// Service-role key is read from the env — never inline it:
//   SUPABASE_SERVICE_ROLE_KEY=$(supabase projects api-keys --project-ref \
//     cxbfuzqjlqipjyinhzqv -o env 2>/dev/null | grep SERVICE | cut -d= -f2) \
//   node scripts/seed-travel.mjs
import { createClient } from '@supabase/supabase-js'

const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!KEY) { console.error('Set SUPABASE_SERVICE_ROLE_KEY in the env first.'); process.exit(1) }
const sb = createClient('https://cxbfuzqjlqipjyinhzqv.supabase.co', KEY)

// The former local-JS trips (all planned; Eric has no visited trips yet).
const TRIPS = [
  { destination: 'Tokyo, Japan', flag: '🇯🇵', summary: 'Sushi Saito. Shibuya. Akihabara. Temples in Kyoto. Ramen.', notes: 'The bucket list trip. Want to do 2 weeks minimum: Tokyo, Kyoto, Osaka. Hit as many ramen spots as possible. Sushi Saito if I can get a reservation.' },
  { destination: 'Barcelona, Spain', flag: '🇪🇸', summary: 'Sagrada Familia. La Boqueria. Gothic Quarter. Beach. Tapas.', notes: 'Architecture, food, beach. The whole package. Would love to catch a Barca game if timing works.' },
  { destination: 'Portugal', flag: '🇵🇹', summary: '', notes: '' },
  { destination: 'Switzerland', flag: '🇨🇭', summary: '', notes: '' },
  { destination: 'Amsterdam, Netherlands', flag: '🇳🇱', summary: '', notes: '' },
  { destination: 'France', flag: '🇫🇷', summary: '', notes: '' },
  { destination: 'Rome, Italy', flag: '🇮🇹', summary: '', notes: '' },
  { destination: 'Thailand', flag: '🇹🇭', summary: '', notes: '' },
  { destination: 'Mexico', flag: '🇲🇽', summary: '', notes: '' },
  { destination: 'Hong Kong', flag: '🇭🇰', summary: '', notes: '' },
  { destination: 'Ghana', flag: '🇬🇭', summary: '', notes: '' },
  { destination: 'India', flag: '🇮🇳', summary: '', notes: '' },
  { destination: 'China', flag: '🇨🇳', summary: '', notes: '' },
  { destination: 'Brazil', flag: '🇧🇷', summary: '', notes: '' },
]

// "City, Country" -> { place: City, country: Country }; otherwise country only.
function splitDestination(d) {
  const i = d.indexOf(', ')
  return i === -1 ? { place: null, country: d } : { place: d.slice(0, i), country: d.slice(i + 2) }
}

const rows = TRIPS.map((t, idx) => {
  const { place, country } = splitDestination(t.destination)
  const notes = [t.summary, t.notes].map(s => (s || '').trim()).filter(Boolean).join('\n\n') || null
  return { country, place, flag: t.flag, status: 'planned', notes, plan_items: [], photo_urls: [], sort_order: idx }
})

// Idempotent-ish: skip if the table already has Eric's trips.
const { count } = await sb.from('travel_log').select('*', { count: 'exact', head: true })
if (count && count > 0) { console.log(`public.travel_log already has ${count} rows — skipping seed.`); process.exit(0) }

const { data, error } = await sb.from('travel_log').insert(rows).select()
if (error) { console.error('Seed failed:', error.message); process.exit(1) }
console.log(`Seeded ${data.length} trips into public.travel_log.`)
for (const r of data) console.log(' -', [r.place, r.country].filter(Boolean).join(', '), r.flag)

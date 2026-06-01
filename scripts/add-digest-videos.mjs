// One-off: add a batch of YouTube videos to Eric's Daily Digest.
// Reads the service-role key from env (never inline it):
//   KEY=$(supabase projects api-keys --project-ref cxbfuzqjlqipjyinhzqv -o json \
//     | jq -r '.[]|select(.name=="service_role").api_key')
//   SUPABASE_SERVICE_ROLE_KEY="$KEY" node scripts/add-digest-videos.mjs
import { createClient } from '@supabase/supabase-js'

const url = 'https://cxbfuzqjlqipjyinhzqv.supabase.co'
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!key) { console.error('Set SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }
const supabase = createClient(url, key)

const PUBLISHED_DATE = '2026-05-31'

const videos = [
  {
    id: 'DU9JCFMJp8E',
    note: "This one threw me for a loop. The reveal at the end and the connection made me wonder how far reaching this whole conspiracy is. I won't reveal anything but it was an interesting watch.",
  },
  {
    id: '0IU5qnr15N8',
    note: "A video essay on the impulse to knock down women people admire — where it comes from and what it reveals about the ones doing it. The kind of cultural-psychology piece that's uncomfortable in a useful way.",
  },
  {
    id: 'WnzR5aOElvw',
    note: "This was a fun watch. It's crazy to think that an AI, when threatened, reached out to journalists. I think it'll be one of those things seen as an argument about the sentience of AI and the ethics behind it. If we're working on replicating a human mind, at what point do we treat it like a human? Is our history of how we treat each other an indication of how a sentient AI would be treated?",
  },
  {
    id: 'aBY4lCj0CUQ',
    note: "Love this song. Have it on my workout playlist. It always reminds me of FIFA for some reason — like one of the songs playing as the team lines up. Also I'm pretty sure a Bowflex commercial used it. The samples are great. I always like a good sample.",
  },
  {
    id: 'E29e-IkTD6o',
    note: "This hotel looked sick. I'd do it some day if I got the chance. It's crazy thinking about the amount of effort it took to install it.",
  },
  {
    id: 'FsW4hEObAtY',
    note: "I always feel that change comes from a mindset shift. Once that's done and the mental change is there, it's easier to put actions to live up to that shift. It's a paradox — thinking and feeling like you're already whatever that goal is, then taking the actions to do it. You'll never do a pull up if you believe you can't. The biggest hurdle is that belief, then using it to give momentum to the training of getting there.",
  },
]

async function titleFor(watchUrl) {
  try {
    const r = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`)
    if (r.ok) return (await r.json()).title
  } catch { /* fall through */ }
  return null
}

for (const v of videos) {
  const watchUrl = `https://www.youtube.com/watch?v=${v.id}`
  const title = (await titleFor(watchUrl)) || watchUrl
  const { error } = await supabase.from('digest_entries').insert({
    title,
    url: watchUrl,
    video_url: watchUrl,
    note: v.note,
    source: 'YouTube',
    published_date: PUBLISHED_DATE,
  })
  console.log(error ? `ERR  ${v.id}: ${error.message}` : `added: ${title}`)
}
console.log('done')

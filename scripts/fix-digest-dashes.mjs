// One-off: rewrite the em-dashes out of the digest notes just added.
//   KEY=$(supabase projects api-keys --project-ref cxbfuzqjlqipjyinhzqv -o json \
//     | jq -r '.[]|select(.name=="service_role").api_key')
//   SUPABASE_SERVICE_ROLE_KEY="$KEY" node scripts/fix-digest-dashes.mjs
import { createClient } from '@supabase/supabase-js'

const url = 'https://cxbfuzqjlqipjyinhzqv.supabase.co'
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!key) { console.error('Set SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }
const supabase = createClient(url, key)

const updates = [
  {
    id: '0IU5qnr15N8',
    note: "A video essay on the impulse to knock down women people admire, where it comes from and what it reveals about the ones doing it. The kind of cultural-psychology piece that's uncomfortable in a useful way.",
  },
  {
    id: 'aBY4lCj0CUQ',
    note: "Love this song. Have it on my workout playlist. It always reminds me of FIFA for some reason, like one of the songs playing as the team lines up. Also I'm pretty sure a Bowflex commercial used it. The samples are great. I always like a good sample.",
  },
  {
    id: 'FsW4hEObAtY',
    note: "I always feel that change comes from a mindset shift. Once that's done and the mental change is there, it's easier to put actions to live up to that shift. It's a paradox: thinking and feeling like you're already whatever that goal is, then taking the actions to do it. You'll never do a pull up if you believe you can't. The biggest hurdle is that belief, then using it to give momentum to the training of getting there.",
  },
]

for (const u of updates) {
  const watchUrl = `https://www.youtube.com/watch?v=${u.id}`
  const { data, error } = await supabase.from('digest_entries')
    .update({ note: u.note }).eq('video_url', watchUrl).select('title')
  console.log(error ? `ERR  ${u.id}: ${error.message}` : `updated: ${data?.[0]?.title || u.id}`)
}
console.log('done')

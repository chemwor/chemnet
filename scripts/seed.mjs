import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const sb = createClient(
  'https://cxbfuzqjlqipjyinhzqv.supabase.co',
  // Using service_role key for seeding (bypasses RLS)
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4YmZ1enFqbHFpcGp5aW5oenF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjY1MjcyNSwiZXhwIjoyMDkyMjI4NzI1fQ.2OXsz2sKM98Zidk3sDt6zfyzY-JnsPb0vONGHntTYdM'
)

async function seed() {
  console.log('Seeding ChemNet database...\n')

  // ── Blog Posts ──
  console.log('📝 Blog posts...')

  // Read the AI paper content
  const aiPaperPath = join(__dirname, '..', 'src', 'apps', 'Blog', 'ai-paper.js')
  const aiPaperModule = readFileSync(aiPaperPath, 'utf8')
  const aiPaperMatch = aiPaperModule.match(/export const AI_PAPER = `([\s\S]*?)`;/)
  const aiPaperContent = aiPaperMatch ? aiPaperMatch[1] : 'Content not found'

  const blogPosts = [
    {
      title: 'Break Down of Artificial Intelligence and Its Impact on Human Life: Present, Future and Possibilities',
      filename: 'Artificial Intelligence in The Workforce.doc',
      content: aiPaperContent,
      raw: null,
      note: 'Research paper written at John McEachern High School, Fall/Spring 2015-2016. Unedited original.',
      layer: 1,
      published: true,
      created_at: '2016-05-18T12:00:00Z',
    },
    {
      title: 'On Using AI to Clean Up My Writing',
      filename: 'On Using AI to Clean Up My Writing.doc',
      content: `What's the difference between me running this blog through AI and a magazine running an article through an editor?

Almost everything we read has been filtered. Movies get cut and recut until the story lands. TV shows are shaped in edit bays. Books go through editors, copyeditors, proofreaders. Even in conversation, we censor ourselves. We pick different words for our boss than for our friends. The final product is never the first draft. It never was.

We just don't see the retakes. That's the part that messes with people.

In school, we were taught the process out loud. Write a draft. Cut the stuff that doesn't serve the main point. Make sure every paragraph ties back. I wasn't great at it. English might have been my worst subject. I still don't know if the way it was taught turned me off, or if I was just a kid who didn't care yet.

What I do know is that I go on tangents. (Am I even using that word right?) Not full detours, more like I grab something on the way to the point because my brain decided it mattered before I could explain why. I notice it when I talk. I notice it when I write. If I want to write anything people actually read, I have to work on it.

I don't have the urge to write a book. But I do want this site to feel like an archive, a record of what I thought about and what I cared about. A blog. A collection of things that make me me.

AI helps me bridge the gap between the idea in my head and the version of it that's presentable. If the tool makes my writing even 5% better than I could on my own, it's worth using. It gives my points structure. It makes them easier to read. The ideas are still mine. The polish is the part I outsource.

I'm also keeping my rough drafts on the site. If you want to see what the thought looked like before it got cleaned up, it's there. I think that matters. Expectation versus reality is one of those things worth showing on purpose, because a lot of people are chasing a version of "good" that was never real to begin with.

Think about photos. Almost every image you see online has been edited. Better lighting. A filter. A crop. It takes real skill to make a photo not look like a random phone snap, and that skill is an art. But we've lost something in the process. We don't see the raw version anymore. We don't see that "perfection" is mostly a pile of mistakes someone learned from. That invisible gap makes people feel like imposters when they're just new.

Part of the reason nobody shows the raw cut is fear. People will use your imperfections against you. Misspell a word and suddenly you're not smart. Which, come on. Bad spelling isn't intelligence. It can be a signal, sure, but people have strengths in different places. We flatten everyone against the same benchmark and call it fair.

Someone picking up a new thing is going to be bad at it. That's the whole deal. The people who respect that give them space to get better. The people who laugh at the first attempt? I feel bad for them. They don't understand what it costs to try something new in public.

(Another tangent, probably.)

All of this to say: can we really drag people for using AI as a tool, when the idea is still theirs and they're the ones shaping it into something worth reading? We accept editing everywhere else. We accept filters, retakes, second drafts, ghostwriters, studio lighting. AI is new and it's scary, and I get why people are suspicious. Some people do want to use it as a replacement instead of a tool. That's fair to push back on.

But I don't think AI should be the idea factory. It should be the thing that lets someone who cares about an idea actually get it out of their head. If that first low-effort interaction gets them hooked enough to go deeper on the craft, even better. The problem isn't the tool. The problem is when the tool becomes the whole shortcut and nobody ever bothers to learn the thing underneath.

I use AI to write cleaner. The ideas are mine. The rough drafts are on the site if you want to see the mess.`,
      raw: `what's the diffrent between editors who fixe things before they are released ? = A lot of what we read and look into has been filtered to some point. We even sensor our selves when we speak. What space is it that we are speaking in. What language and words are and are off limits. It makes me wonder what gets lost in the process of drafting. We see the final product but not the retakes, edits, removing things that might not be relevant

Movies are clipped and edited to give us a final form. A story is being told there but the way it's being done needs to get the main over arching point to audience memebers of all kinds. Same with a tv show or any media we consume in general. There's hard work being done behind the scenes that we don't get to see. A hidden magic that some see as the standard or achievable on the first try.

In school we would work on cleaning up our drafts. We would be given a topic we would need to write on. We would go through the process of this paragraph will be for this this other one is a new point. All of that combined should go back to the main point of the paper.

I wasn't really the best in english, it might have been my weakest subject. I do wonder if the way in which learning these topics hindered triggering something in me that would want to go further into improving my skills with writing. I have a habit to go off tangent(is this even being used right) at times. Not a complete detour but more of like a stop of picking up something that will be used in the point or over arching topic. I don't know the origin of this, if it's talking about one point and having it trigger something that is tied to the original topic but makes sense to me in the moment since th thought hasn't been fully articulated. I know these points in my structuring with the way I speak and write. I also know I need to work on it if I want to write anything. I don't have an urge to write a book but with this site it feels like a blog or an archive of my thoughts or the tings that make me as a person. In the age of AI, the tools out there help as a good stop gap for bridging my ideas and points in a way the personally I don't feel like I'm the greatest at. If it's even 5% better than me, I do think it's worth using to make my blogs. It gives the points more structure and something that's more presentable for someone to read. I also keep my rough drafts on the site so those that are interested in seeing my writing at its core can if they want. This expectations vs reality is one of those things I feel is important to point out so that people aren't chasing a perfection that doesn't exist

This takes me to how a lot of the images that we see are edited to an extent. Better lighting maybe a filter or something else. It takes a skill to be able to take photos that don't feel like a random one shows with a phone camera. It's an art and skill. With that though we do lose out on getting a more raw and unfiltered version to know that perfection is a process of many mistakes and getting better at not making them. This unrealistic expectation makes people feel like imposters or behind when in reality they aren't. It's just a filter.

There's also a fear with showing a raw cut due to how people would react. These dents/imperfections can be used against the poster for whatever reason - peoples judgment. Can't spell and it's seen as a big hit even simple words and that in it'self excludes other attributes that got that person there. Bad spelling != intelligence in my opinion. It can be a sign but some people have subject matters and things that lean heavily for them and some are well rounded. Each person is different but we use standards to flatten down and get a general benchmark of what is considered up to par. Someone can try something new and be terrible and that's okay since they are new and will get better if they keep up at it. Those that respect that will give space for that person to learn this craft and not get them discouraged. The negative are those that laugh and point at the failed attempt. I feel sad for them due to not understanding the courage it takes to pick up something new and try. This could be a whole other tanagent(again am I using this right) All os this to say, can we critic those that use AI as a tool to help get things done if they are the ones coming up with the original idea and polishing it up for something to present ? We do it with a lot of things even the way we show up but in a time where we have a new technology that is scary and we have people wanting to use it as a replacement and not a tool. I understand why some would be against it. I don't think AI should be the idea factory. It should be the tool that helps those without the ability to pick up something they are interested in at a low level. Hopefully that low level interaction gets them to get better in their craft but It shouldn't be used as a full short cut to jump in and never explore deeper.`,
      note: null,
      layer: 1,
      published: true,
      created_at: '2026-04-19T12:00:00Z',
    },
  ]

  const { error: blogErr } = await sb.from('blog_posts').insert(blogPosts)
  console.log(blogErr ? `  ❌ ${blogErr.message}` : `  ✅ ${blogPosts.length} posts inserted`)

  // ── Reviews ──
  console.log('🎬 Reviews...')
  const reviews = [
    { category: 'movies', title: 'Dune: Part Two', year: 2024, rating: 9, status: 'watched', poster: '🏜️', review: 'Villeneuve did it again. The scale, the sound design, the performances. Austin Butler as Feyd-Rautha is terrifying. This is what blockbusters should be.', tags: ['Sci-Fi', 'Epic'], analysis: null },
    { category: 'movies', title: 'Past Lives', year: 2023, rating: 9, status: 'watched', poster: '💫', review: 'Quietly devastating. The kind of movie that sits with you for weeks. Greta Lee is incredible.', tags: ['Drama', 'Romance'], analysis: null },
    { category: 'movies', title: 'Oppenheimer', year: 2023, rating: 8, status: 'watched', poster: '💣', review: 'Nolan at his most restrained and most ambitious. RDJ deserved that Oscar.', tags: ['Drama', 'History'], analysis: null },
    { category: 'movies', title: 'Everything Everywhere All at Once', year: 2022, rating: 10, status: 'watched', poster: '🥯', review: 'The most creative movie I have ever seen. It is about everything and somehow it all works. Cried three times.', tags: ['Sci-Fi', 'Comedy', 'Drama'], analysis: null },
    { category: 'movies', title: 'The Brutalist', year: 2025, rating: 0, status: 'watchlist', poster: '🏗️', review: '', tags: ['Drama'], analysis: null },
    { category: 'movies', title: 'Sinners', year: 2025, rating: 0, status: 'watchlist', poster: '🎸', review: '', tags: ['Horror', 'Drama'], analysis: null },
    { category: 'tv', title: 'Severance', year: 2022, rating: 10, status: 'watched', poster: '🧠', review: 'The best show on TV right now. The concept is genius but the execution is what makes it.', tags: ['Thriller', 'Sci-Fi'], analysis: null },
    { category: 'tv', title: 'The Bear', year: 2022, rating: 9, status: 'watched', poster: '🍳', review: 'The anxiety of this show is a feature not a bug. Carmy is frustrating in a way that feels real.', tags: ['Drama', 'Food'], analysis: null },
    { category: 'tv', title: 'Shogun', year: 2024, rating: 9, status: 'watched', poster: '⚔️', review: 'Slow in the best way. Every frame is a painting. Toranaga is the most compelling character on TV.', tags: ['Drama', 'History'], analysis: null },
    { category: 'tv', title: 'Fallout', year: 2024, rating: 8, status: 'watched', poster: '☢️', review: 'Did not think a video game adaptation would hit this hard. Walton Goggins is perfect.', tags: ['Sci-Fi', 'Action'], analysis: null },
    { category: 'tv', title: 'Arcane', year: 2021, rating: 10, status: 'watched', poster: '⚡', review: 'Animation at its absolute peak. The art style, the story, the music. One of my favorite shows ever.', tags: ['Animation', 'Action'], analysis: null },
    { category: 'tv', title: 'White Lotus S3', year: 2025, rating: 0, status: 'watchlist', poster: '🌺', review: '', tags: ['Drama', 'Satire'], analysis: null },
  ]

  const { error: revErr } = await sb.from('reviews').insert(reviews)
  console.log(revErr ? `  ❌ ${revErr.message}` : `  ✅ ${reviews.length} reviews inserted`)

  // ── Restaurants ──
  console.log('🍽️ Restaurants...')
  const restaurants = [
    { name: 'Carnivore', location: 'Nairobi, Kenya', cuisine: 'BBQ / Game Meat', status: 'been', rating: 9, icon: '🥩', review: 'The beast of a feast. All-you-can-eat game meat served on Maasai swords.', favorite: 'Ostrich meatballs + dawa cocktail', vibe: 'Safari lodge meets food hall', why: null },
    { name: 'About Thyme', location: 'Nairobi, Kenya', cuisine: 'Modern European', status: 'been', rating: 8, icon: '🌿', review: 'Clean, thoughtful plating. Great wine list.', favorite: 'Lamb shank', vibe: 'Date night, impress someone', why: null },
    { name: 'Mama Oliech', location: 'Nairobi, Kenya', cuisine: 'Kenyan / Fish', status: 'been', rating: 9, icon: '🐟', review: 'The best fish in Nairobi, full stop. Obama ate here.', favorite: 'Fried whole tilapia + ugali', vibe: 'No-nonsense, the food speaks', why: null },
    { name: 'Kilimanjaro Jamia', location: 'Nairobi, Kenya', cuisine: 'Swahili / Coast', status: 'been', rating: 8, icon: '🍛', review: 'Biryanis that hit different. Old school Nairobi institution.', favorite: 'Chicken biryani + mishkaki', vibe: 'Local legend', why: null },
    { name: 'Hereford & Hops', location: 'Nairobi, Kenya', cuisine: 'Gastropub', status: 'been', rating: 7, icon: '🍔', review: 'Solid burgers, good craft beer selection.', favorite: 'Classic burger + pale ale', vibe: 'Casual hangout, sports bar energy', why: null },
    { name: 'Tin Roof Café', location: 'Nairobi, Kenya', cuisine: 'Brunch / Café', status: 'been', rating: 8, icon: '☕', review: 'Best brunch spot in Karen. The garden setting is beautiful.', favorite: 'Eggs benedict + fresh juice', vibe: 'Weekend brunch, garden vibes', why: null },
    { name: 'Nobu', location: 'Malibu, CA', cuisine: 'Japanese', status: 'want', rating: 0, icon: '🍣', review: null, favorite: null, vibe: null, why: 'The black cod miso is legendary. Need to experience it at the Malibu location.' },
    { name: 'Supper', location: 'Nairobi, Kenya', cuisine: 'Pan-Asian', status: 'want', rating: 0, icon: '🥢', review: null, favorite: null, vibe: null, why: 'Everyone keeps telling me to go. The sushi is supposedly incredible.' },
    { name: 'Sushi Saito', location: 'Tokyo, Japan', cuisine: 'Omakase', status: 'want', rating: 0, icon: '🏯', review: null, favorite: null, vibe: null, why: 'Three Michelin stars. 8-seat counter. The ultimate sushi experience.' },
    { name: 'Asador Etxebarri', location: 'Basque Country, Spain', cuisine: 'Grill', status: 'want', rating: 0, icon: '🔥', review: null, favorite: null, vibe: null, why: 'They grill everything including dessert. Top 10 in the world.' },
    { name: 'Franklin BBQ', location: 'Austin, TX', cuisine: 'BBQ', status: 'want', rating: 0, icon: '🍖', review: null, favorite: null, vibe: null, why: 'The 4-hour line is the price of admission. Brisket that changes your understanding of meat.' },
  ]

  const { error: restErr } = await sb.from('restaurants').insert(restaurants)
  console.log(restErr ? `  ❌ ${restErr.message}` : `  ✅ ${restaurants.length} restaurants inserted`)

  // ── Guestbook ──
  console.log('📖 Guestbook...')
  const guestbook = [
    { name: 'nightcoder_42', location: 'San Francisco, CA', message: 'This is the coolest personal site I have ever seen. The terminal with the hidden files is genius.', created_at: '2026-04-02T12:00:00Z' },
    { name: 'explorer_jane', location: 'London, UK', message: 'Stumbled onto this from Twitter. Played Asteroids for way too long. Signed the book before I forget.', created_at: '2026-04-05T12:00:00Z' },
    { name: 'k3nyan_dev', location: 'Nairobi, Kenya', message: 'Mkenya mwenzangu! Love seeing Kenyan devs build cool things. The chess Swahili names are a nice touch. Hongera!', created_at: '2026-04-06T12:00:00Z' },
    { name: 'pixel_punk', location: 'Tokyo, Japan', message: 'The Win95 aesthetic is perfect. Reminds me of my first computer. Never stop building weird stuff on the internet.', created_at: '2026-04-08T12:00:00Z' },
    { name: 'curious_cat', location: 'Toronto, Canada', message: 'Found the social media manifesto in .hidden. "The algorithm just isn\'t going to hand it to you." Real talk.', created_at: '2026-04-10T12:00:00Z' },
    { name: 'anon', location: 'The Internet', message: 'sudo rm -rf / got me with that one. GG.', created_at: '2026-04-12T12:00:00Z' },
  ]

  const { error: gbErr } = await sb.from('guestbook_entries').insert(guestbook)
  console.log(gbErr ? `  ❌ ${gbErr.message}` : `  ✅ ${guestbook.length} entries inserted`)

  // ── Message Board ──
  console.log('💬 Message Board...')
  const threads = [
    { subject: 'Welcome to the ChemNet Message Board!', author: 'SysOp_Eric', created_at: '2026-04-01T09:00:00Z' },
    { subject: 'Found an easter egg!', author: 'explorer_jane', created_at: '2026-04-05T14:22:00Z' },
    { subject: 'Best game on here?', author: 'pixel_punk', created_at: '2026-04-08T16:45:00Z' },
    { subject: 'How was this site built?', author: 'curious_cat', created_at: '2026-04-10T10:00:00Z' },
  ]

  const { data: threadData, error: thErr } = await sb.from('message_threads').insert(threads).select()
  console.log(thErr ? `  ❌ ${thErr.message}` : `  ✅ ${threads.length} threads inserted`)

  if (threadData) {
    const posts = [
      { thread_id: threadData[0].id, author: 'SysOp_Eric', body: 'Welcome to the board! This is a place to hang out, ask questions, share ideas, or just say what\'s up.\n\nKeep it chill. Be cool to each other.\n\n— Eric (SysOp)', is_sysop: true, created_at: '2026-04-01T09:00:00Z' },
      { thread_id: threadData[0].id, author: 'nightcoder_42', body: 'This site is wild. Feels like I just time-traveled to 1997. Love it.', is_sysop: false, created_at: '2026-04-02T23:41:00Z' },
      { thread_id: threadData[0].id, author: 'SysOp_Eric', body: 'That\'s exactly the vibe I was going for. Glad you\'re here!', is_sysop: true, created_at: '2026-04-03T08:15:00Z' },
      { thread_id: threadData[1].id, author: 'explorer_jane', body: 'I typed something in the terminal and my whole screen turned blue. Was that supposed to happen??', is_sysop: false, created_at: '2026-04-05T14:22:00Z' },
      { thread_id: threadData[1].id, author: 'SysOp_Eric', body: 'You found one. There are more. I won\'t say how many.', is_sysop: true, created_at: '2026-04-05T15:10:00Z' },
      { thread_id: threadData[1].id, author: 'k3nyan_dev', body: 'Wait there are EASTER EGGS?? BRB going to try everything.', is_sysop: false, created_at: '2026-04-06T11:30:00Z' },
      { thread_id: threadData[2].id, author: 'pixel_punk', body: 'Been playing all the games. Asteroids is addicting but the Chess AI keeps destroying me. What\'s everyone\'s favorite?', is_sysop: false, created_at: '2026-04-08T16:45:00Z' },
      { thread_id: threadData[2].id, author: 'nightcoder_42', body: 'Minesweeper on expert mode. I\'m a masochist apparently.', is_sysop: false, created_at: '2026-04-08T20:12:00Z' },
      { thread_id: threadData[2].id, author: 'explorer_jane', body: 'The Rock\'em Sock\'em robots!! I\'m just mashing spacebar like my life depends on it', is_sysop: false, created_at: '2026-04-09T09:33:00Z' },
      { thread_id: threadData[3].id, author: 'curious_cat', body: 'Seriously impressed by this. Is this all React? How long did it take?', is_sysop: false, created_at: '2026-04-10T10:00:00Z' },
      { thread_id: threadData[3].id, author: 'SysOp_Eric', body: 'React + Vite + react95 + Tailwind + Framer Motion. The games are all canvas-based. Check the Terminal and type "neofetch" for the full stack info.', is_sysop: true, created_at: '2026-04-10T11:45:00Z' },
    ]

    const { error: postErr } = await sb.from('message_posts').insert(posts)
    console.log(postErr ? `  ❌ ${postErr.message}` : `  ✅ ${posts.length} posts inserted`)
  }

  console.log('\n✅ Seeding complete!')
}

seed().catch(console.error)

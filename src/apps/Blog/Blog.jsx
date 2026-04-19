import { useState } from 'react'
import { iconUrl } from '../../shell/icons'
import { AI_PAPER } from './ai-paper'

// ── Blog posts ──
const POSTS = [
  {
    id: 'ai-workforce',
    filename: 'Artificial Intelligence in The Workforce.doc',
    date: '2016-05-18',
    size: '48 KB',
    title: 'Break Down of Artificial Intelligence and Its Impact on Human Life: Present, Future and Possibilities',
    content: AI_PAPER,
    raw: null, // this IS the raw — written in high school, unedited
    note: 'Research paper written at John McEachern High School, Fall/Spring 2015-2016. Unedited original.',
  },
  {
    id: 'ai-writing',
    filename: 'On Using AI to Clean Up My Writing.doc',
    date: '2026-04-19',
    size: '18 KB',
    title: 'On Using AI to Clean Up My Writing',
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
  },
]

// ── Document icon SVG ──
const DOC_ICON = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="4" y="2" width="20" height="28" fill="#fff" stroke="#000" stroke-width=".8"/><rect x="4" y="2" width="6" height="6" fill="#00a"/><path d="M4 2h6v6H4z" fill="#00a"/><text x="7" y="7" fill="#fff" font-size="5" font-family="serif" font-weight="bold">W</text><line x1="8" y1="12" x2="20" y2="12" stroke="#000" stroke-width=".4"/><line x1="8" y1="15" x2="20" y2="15" stroke="#000" stroke-width=".4"/><line x1="8" y1="18" x2="20" y2="18" stroke="#000" stroke-width=".4"/><line x1="8" y1="21" x2="16" y2="21" stroke="#000" stroke-width=".4"/></svg>`)}`

// ── File directory view ──
function FileDirectory({ posts, onOpen }) {
  const [selectedId, setSelectedId] = useState(null)

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#fff' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1 shrink-0" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-bevel-dark)' }}>
        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          📂 C:\Documents\Blog
        </span>
        <span className="ml-auto text-xs" style={{ color: 'var(--color-text-disabled)' }}>
          {posts.length} item(s)
        </span>
      </div>

      {/* Column headers */}
      <div
        className="flex items-center px-2 py-0.5 text-xs shrink-0"
        style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-bevel-dark)',
          color: 'var(--color-text-primary)',
          fontFamily: 'monospace',
        }}
      >
        <div style={{ width: 28 }} />
        <div className="flex-1 font-bold">Name</div>
        <div className="font-bold" style={{ width: 70, textAlign: 'right' }}>Size</div>
        <div className="font-bold" style={{ width: 90, textAlign: 'right' }}>Modified</div>
      </div>

      {/* File list — newest first */}
      <div className="flex-1 overflow-auto" style={{ background: '#fff' }}>
        {[...posts].sort((a, b) => b.date.localeCompare(a.date)).map(post => {
          const isSelected = selectedId === post.id
          return (
            <div
              key={post.id}
              className="flex items-center px-2 py-1 cursor-pointer"
              style={{
                background: isSelected ? '#000080' : 'transparent',
                color: isSelected ? '#fff' : '#000',
                fontFamily: 'monospace',
                fontSize: 12,
              }}
              onClick={() => setSelectedId(post.id)}
              onDoubleClick={() => onOpen(post.id)}
            >
              <img
                src={DOC_ICON}
                alt=""
                width={20}
                height={20}
                style={{ imageRendering: 'pixelated', marginRight: 8 }}
                draggable={false}
              />
              <div className="flex-1 truncate">{post.filename}</div>
              <div style={{ width: 70, textAlign: 'right', color: isSelected ? '#ccc' : '#666' }}>{post.size}</div>
              <div style={{ width: 90, textAlign: 'right', color: isSelected ? '#ccc' : '#666' }}>{post.date}</div>
            </div>
          )
        })}
      </div>

      {/* Status bar */}
      <div
        className="flex items-center px-2 py-0.5 text-xs shrink-0"
        style={{
          background: 'var(--color-surface)',
          borderTop: '1px solid var(--color-bevel-dark)',
          color: 'var(--color-text-secondary)',
        }}
      >
        {selectedId
          ? `${posts.find(p => p.id === selectedId)?.filename} — Double-click to open`
          : 'Select a document to read'}
      </div>
    </div>
  )
}

// ── Word-style document viewer ──
const PAGE_HEIGHT = 680 // approximate content height per page in px
const PAGE_PADDING = 40

function paginateContent(text, isTitle) {
  const paragraphs = text.split('\n\n')
  const pages = [[]]
  let currentHeight = isTitle ? 80 : 0 // title takes space on first page
  const lineHeight = 22 // approximate px per line
  const charsPerLine = 65

  for (const para of paragraphs) {
    const lines = Math.max(1, Math.ceil(para.length / charsPerLine))
    const paraHeight = lines * lineHeight + 16 // 16px margin
    if (currentHeight + paraHeight > PAGE_HEIGHT && pages[pages.length - 1].length > 0) {
      pages.push([])
      currentHeight = 0
    }
    pages[pages.length - 1].push(para)
    currentHeight += paraHeight
  }
  return pages
}

function DocumentViewer({ post, onBack }) {
  const [showRaw, setShowRaw] = useState(false)

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#fff' }}>
      {/* Menu bar */}
      <div
        className="flex items-center gap-3 px-2 py-1 text-xs shrink-0"
        style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-bevel-dark)',
          fontFamily: 'monospace',
          color: 'var(--color-text-primary)',
        }}
      >
        <button
          onClick={onBack}
          className="border-none bg-transparent cursor-pointer text-xs underline"
          style={{ color: 'var(--color-accent)' }}
        >
          ← Back to Blog
        </button>
        <span style={{ color: 'var(--color-text-disabled)' }}>|</span>
        <span style={{ color: 'var(--color-text-secondary)' }}>File</span>
        <span style={{ color: 'var(--color-text-secondary)' }}>Edit</span>
        <span style={{ color: 'var(--color-text-secondary)' }}>View</span>
        <span style={{ color: 'var(--color-text-secondary)' }}>Format</span>
        <span style={{ color: 'var(--color-text-secondary)' }}>Help</span>
      </div>

      {/* Toolbar */}
      <div
        className="flex items-center gap-2 px-2 py-1 shrink-0"
        style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-bevel-dark)',
        }}
      >
        <select
          className="text-xs px-1 py-0.5"
          style={{
            background: '#fff',
            border: '1px solid #999',
            fontFamily: 'monospace',
            color: '#000',
          }}
          defaultValue="times"
          disabled
        >
          <option value="times">Times New Roman</option>
        </select>
        <select
          className="text-xs px-1 py-0.5"
          style={{
            background: '#fff',
            border: '1px solid #999',
            fontFamily: 'monospace',
            color: '#000',
            width: 40,
          }}
          defaultValue="12"
          disabled
        >
          <option value="12">12</option>
        </select>
        <div style={{ width: 1, height: 16, background: '#ccc', margin: '0 4px' }} />
        <span className="text-xs font-bold" style={{ color: '#666' }}>B</span>
        <span className="text-xs italic" style={{ color: '#666' }}>I</span>
        <span className="text-xs underline" style={{ color: '#666' }}>U</span>

        {/* Raw/Polished toggle */}
        {post.raw && (
          <>
            <div style={{ width: 1, height: 16, background: '#ccc', margin: '0 8px' }} />
            <button
              onClick={() => setShowRaw(false)}
              className="px-2 py-0.5 text-xs cursor-pointer border-none"
              style={{
                background: !showRaw ? '#000080' : '#d4d0c8',
                color: !showRaw ? '#fff' : '#000',
                fontFamily: 'monospace',
                border: '1px solid #808080',
              }}
            >
              Polished
            </button>
            <button
              onClick={() => setShowRaw(true)}
              className="px-2 py-0.5 text-xs cursor-pointer border-none"
              style={{
                background: showRaw ? '#000080' : '#d4d0c8',
                color: showRaw ? '#fff' : '#000',
                fontFamily: 'monospace',
                border: '1px solid #808080',
              }}
            >
              Raw Draft
            </button>
          </>
        )}
      </div>

      {/* Ruler */}
      <div
        className="px-2 shrink-0"
        style={{
          background: '#f0f0f0',
          borderBottom: '1px solid #ccc',
          height: 14,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {Array.from({ length: 20 }, (_, i) => (
          <span key={i} className="text-[7px]" style={{ color: '#999', width: '5%', textAlign: 'center' }}>
            {i % 2 === 0 ? i / 2 : '·'}
          </span>
        ))}
      </div>

      {/* Document area — paginated pages */}
      <div className="flex-1 overflow-auto" style={{ background: '#e8e8e8', padding: '16px 0' }}>
        {(() => {
          const bodyText = showRaw && post.raw ? post.raw : post.content
          const pages = paginateContent(bodyText, true)
          const fontFamily = showRaw ? '"Courier New", monospace' : '"Georgia", "Times New Roman", serif'
          const fontSize = showRaw ? 12 : 14
          const lineHt = showRaw ? 1.5 : 1.7
          const textColor = showRaw ? '#33FF33' : '#1a1a1a'
          const pageBg = showRaw ? '#1a1a1a' : '#fff'

          return pages.map((pageParagraphs, pageIdx) => (
            <div key={pageIdx} style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div
                style={{
                  background: pageBg,
                  width: '100%',
                  maxWidth: 620,
                  height: PAGE_HEIGHT + PAGE_PADDING * 2,
                  padding: `${PAGE_PADDING}px ${PAGE_PADDING + 8}px`,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                  fontFamily, fontSize, lineHeight: lineHt, color: textColor,
                  overflow: 'hidden',
                  position: 'relative',
                  marginLeft: 12, marginRight: 12,
                }}
              >
                {/* First page gets header */}
                {pageIdx === 0 && (
                  <>
                    <h1 style={{
                      fontSize: showRaw ? 14 : 20,
                      fontWeight: 'bold',
                      margin: '0 0 6px',
                      color: showRaw ? '#66FF66' : '#000',
                      fontFamily: showRaw ? '"Courier New", monospace' : '"Georgia", serif',
                    }}>
                      {showRaw ? `> cat --raw "${post.filename}"` : post.title}
                    </h1>

                    {showRaw && (
                      <div style={{ fontSize: 10, color: '#227722', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #227722' }}>
                        ── raw draft — unedited, as originally written ──
                      </div>
                    )}

                    {!showRaw && (
                      <div style={{ fontSize: 10, color: '#888', marginBottom: post.note ? 4 : 16, paddingBottom: 8, borderBottom: post.note ? 'none' : '1px solid #ddd', fontFamily: 'monospace' }}>
                        {post.date} &middot; {post.size}
                      </div>
                    )}

                    {!showRaw && post.note && (
                      <div style={{ fontSize: 9, color: '#999', fontStyle: 'italic', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #ddd', fontFamily: 'monospace' }}>
                        {post.note}
                      </div>
                    )}
                  </>
                )}

                {pageParagraphs.map((para, i) => (
                  <p key={i} style={{ margin: '0 0 12px', textAlign: showRaw ? 'left' : 'justify' }}>
                    {para}
                  </p>
                ))}

                {/* Last page raw footer */}
                {showRaw && pageIdx === pages.length - 1 && (
                  <div style={{ fontSize: 10, color: '#227722', marginTop: 16, paddingTop: 6, borderTop: '1px solid #227722' }}>
                    ── end of raw draft ──
                  </div>
                )}

                {/* Page number */}
                <div style={{
                  position: 'absolute', bottom: 12, left: 0, right: 0,
                  textAlign: 'center', fontSize: 9,
                  color: showRaw ? '#227722' : '#bbb',
                  fontFamily: 'monospace',
                }}>
                  Page {pageIdx + 1} of {pages.length}
                </div>
              </div>
            </div>
          ))
        })()}
      </div>

      {/* Status bar */}
      <div
        className="flex items-center justify-between px-2 py-0.5 text-xs shrink-0"
        style={{
          background: 'var(--color-surface)',
          borderTop: '1px solid var(--color-bevel-dark)',
          color: 'var(--color-text-secondary)',
          fontFamily: 'monospace',
        }}
      >
        <span>{post.filename} {showRaw ? '(raw draft)' : ''}</span>
        <span>
          {paginateContent(showRaw && post.raw ? post.raw : post.content, true).length} page(s) &middot; {showRaw ? 'unedited original' : 'polished'}
        </span>
      </div>
    </div>
  )
}

// ── Main Blog component ──
export default function Blog() {
  const [openPostId, setOpenPostId] = useState(null)

  const openPost = POSTS.find(p => p.id === openPostId)

  if (openPost) {
    return <DocumentViewer post={openPost} onBack={() => setOpenPostId(null)} />
  }

  return <FileDirectory posts={POSTS} onOpen={setOpenPostId} />
}

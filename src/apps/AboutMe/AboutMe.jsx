import { useState, useEffect, useCallback } from 'react'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useProfile } from '../../context/ProfileContext'
import { useRepo } from '../../lib/repo/useRepo'
import { Monogram } from '../_shared/Monogram'

// Eric's "system uptime" since birth — computed once at module load (calling
// Date.now() during render is impure / flagged by react-hooks/purity).
const ERIC_UPTIME_DAYS = Math.floor((Date.now() - new Date('1998-05-05').getTime()) / (1000 * 60 * 60 * 24)).toLocaleString()

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'heritage', label: 'Heritage' },
  { id: 'training', label: 'Training' },
  { id: 'arts', label: 'Arts' },
  { id: 'media', label: 'Media' },
  { id: 'food', label: 'Food' },
  { id: 'odds', label: 'Odds & Ends' },
]

function Row({ label, value, accent }) {
  return (
    <div className="flex" style={{ padding: '3px 0', borderBottom: '1px solid #2a2840', fontSize: 12 }}>
      <span style={{ color: '#888', width: 130, shrink: 0 }}>{label}</span>
      <span style={{ color: accent ? '#FF6B35' : '#ddd', flex: 1 }}>{value}</span>
    </div>
  )
}

function SectionLabel({ children }) {
  return <div style={{ color: '#FF6B35', fontSize: 11, fontWeight: 'bold', padding: '10px 0 4px', borderBottom: '1px solid #3a3855' }}>{children}</div>
}

function GeneralTab() {
  return (
    <div>
      <SectionLabel>System Info</SectionLabel>
      <Row label="Name" value="Eric Chemwor" />
      <Row label="Born" value="May 5, 1998, Wales" />
      <Row label="Ancestry" value="Kenyan & Tanzanian" />
      <Row label="Came to US" value="Age 3" />
      <Row label="US Citizen" value="Age 16" />
      <Row label="Siblings" value="Younger brother, 4 years younger" />

      <SectionLabel>Location</SectionLabel>
      <Row label="Grew up" value="Powder Springs, GA" />
      <Row label="Currently" value="Smyrna, GA" />

      <SectionLabel>System Preferences</SectionLabel>
      <Row label="Schedule" value="Early bird" />
      <Row label="Boot sequence" value="Green tea" />
      <Row label="Personality" value="INTJ" />
      <Row label="Loves" value="Nature and hiking" />

      <SectionLabel>Childhood Dream Jobs</SectionLabel>
      <div style={{ color: '#aaa', fontSize: 12, padding: '4px 0', lineHeight: 1.6 }}>
        Ninja, astronaut, fireman, pilot
      </div>

      <SectionLabel>Superstition</SectionLabel>
      <div style={{ color: '#aaa', fontSize: 12, padding: '4px 0', lineHeight: 1.6 }}>
        Don't look at mirrors at night. Bad energy and spirits.
      </div>
    </div>
  )
}

function HeritageTab() {
  return (
    <div>
      <SectionLabel>Ethnic Groups</SectionLabel>
      <Row label="Kalenjin" value="Highland people of the Rift Valley, western Kenya. Known globally as distance runners. Speak Kalenjin." />
      <Row label="Luo" value="Nilotic people around Lake Victoria in western Kenya. Known for music, academics, and fishing culture. Speak Dholuo." />
      <Row label="Kikuyu" value="The largest ethnic group in Kenya. Based in the central highlands around Mt. Kenya. Speak Gikuyu." />
      <Row label="Chaga" value="Bantu-speaking people living on the slopes of Mt. Kilimanjaro in Tanzania. Known for agriculture and trade." />

      <SectionLabel>Name Meanings</SectionLabel>
      <Row label="Rotich" value="Kalenjin. Means the time of day the cows come back from herding." accent />
      <div style={{ color: '#666', fontSize: 10, padding: '4px 0' }}>Middle name, passed down through the Kalenjin side.</div>

      <SectionLabel>Languages</SectionLabel>
      <Row label="English" value="Primary" />
      <Row label="Swahili" value="Can understand it, some phrases, can't speak it" />
      <Row label="Kalenjin" value="Don't know it" />

    </div>
  )
}

function TrainingTab() {
  return (
    <div>
      <SectionLabel>Martial Arts</SectionLabel>
      <Row label="Taekwondo" value="Age 7-16. Georgia state champion, 2012." />
      <Row label="Wrestling" value="4 years of high school. JV captain freshman and sophomore year. Varsity junior year. Varsity captain as a senior." />
      <Row label="BJJ" value="Started at 14 for 2 years. Picked it back up in college for a year and a half. Started again at 23 and haven't stopped. Purple belt under Rodrigo Artilheiro." />
      <Row label="Boxing" value="Started at 26. No sparring for now. Preserving the brain." />

      <SectionLabel>Stats</SectionLabel>
      <Row label="Fastest mile" value="4:49" accent />
      <Row label="Favorite sub" value="Baseball choke" />
      <Row label="Favorite takedown" value="Duck under" />
    </div>
  )
}

function ArtsTab() {
  return (
    <div>
      <SectionLabel>Instruments</SectionLabel>
      <Row label="Piano" value="Active" />
      <Row label="Guitar" value="Active" />
      <Row label="Violin" value="Played 6th through 9th grade. Picking it back up." />

      <SectionLabel>Piano Songs to Learn</SectionLabel>
      <Row label="1" value="Igor's Theme" />
      <Row label="2" value="Congratulations" />
      <Row label="3" value="Heartbeat" />
      <Row label="4" value="La Valse d'Amelie" />
      <Row label="5" value="Gymnopedie No.1" />
      <Row label="6" value="Superstar" />
    </div>
  )
}

function MediaTab() {
  return (
    <div>
      <SectionLabel>Favorites</SectionLabel>
      <Row label="Show" value="Black Mirror" />
      <Row label="Anime" value="Toss up between Bleach and Naruto" />
      <Row label="Video game" value="Jet Set Radio Future" accent />
      <div style={{ color: '#666', fontSize: 10, padding: '2px 0 6px 130' }}>Have loved it since I was 5. Will love it till the day I die.</div>
      <Row label="Album" value="Call Me If You Get Lost" />
      <Row label="Genre" value="R&B and chill rap" />

      <SectionLabel>Favorite Song</SectionLabel>
      <Row label="Song" value="Alright by Kendrick Lamar" accent />
      <div style={{ color: '#aaa', fontSize: 12, padding: '4px 0', lineHeight: 1.6 }}>
        Can lift me up in any mood. Some magic to it.
      </div>

      <SectionLabel>Favorite Movie</SectionLabel>
      <Row label="Movie" value="Fight Club" accent />
      <div style={{ color: '#aaa', fontSize: 12, padding: '4px 0', lineHeight: 1.6 }}>
        A red flag movie on the surface, but read as a commentary on masculinity. Men performing to fit the role society hands them while chasing the next product in a consumer-driven system. It's a green flag.
      </div>
    </div>
  )
}

function FoodTab() {
  return (
    <div>
      <SectionLabel>Top Picks</SectionLabel>
      <Row label="Cuisine" value="Indian. Love the spice work." />
      <Row label="Favorite foods" value="Chapos, kachumbari, dengu" accent />

      <SectionLabel>Liked</SectionLabel>
      <div style={{ color: '#aaa', fontSize: 12, padding: '4px 0', lineHeight: 1.6 }}>
        Wings, pizza (who doesn't), potatoes in any form, chicken tikka masala, samosas, ice cream
      </div>

      <SectionLabel>Disliked</SectionLabel>
      <div style={{ color: '#aaa', fontSize: 12, padding: '4px 0', lineHeight: 1.6 }}>
        Strawberries, spinach, ranch, blue cheese, grits
      </div>

      <SectionLabel>Sweets (the vice)</SectionLabel>
      <Row label="Candy" value="Wild Berry Skittles" />
      <div style={{ color: '#666', fontSize: 10, padding: '2px 0 6px 130' }}>Ms. Walker gave me a pack in 2nd grade for reading the most books in the class during the Pizza Hut challenge. Never forgot it.</div>
      <Row label="Chocolate" value="Snickers" />
      <Row label="Dessert" value="Red velvet cake or ice cream with cake chunks. Mood-dependent." />
      <Row label="Donut" value="Cruller" />
      <Row label="Cookie" value="White chocolate macadamia nut" />
      <Row label="Soda" value="Black Currant Fanta" accent />

      <SectionLabel>Spots</SectionLabel>
      <Row label="Butcher" value="Kingship Butcher" accent />
    </div>
  )
}

function OddsTab() {
  return (
    <div>
      <SectionLabel>Favorites</SectionLabel>
      <Row label="Color" value="Black" />
      <Row label="Animal" value="Crow" />
      <Row label="Smell" value="Vanilla and cinnamon" />
      <Row label="Decor" value="Midcentury modern" />
      <Row label="Stores" value="Best Buy and Guitar Center" />
      <Row label="Team" value="Manchester United" />
      <Row label="Dream car" value="Porsche 911 GT3" accent />
      <Row label="Luxury spend" value="Tech. Always a new gadget." />
    </div>
  )
}

const TAB_COMPONENTS = {
  general: GeneralTab,
  heritage: HeritageTab,
  training: TrainingTab,
  arts: ArtsTab,
  media: MediaTab,
  food: FoodTab,
  odds: OddsTab,
}

// ══════════════════════════════════════════
// DESKTOP — Win95 System Properties
// ══════════════════════════════════════════

function DesktopAbout() {
  const [tab, setTab] = useState('general')
  const TabContent = TAB_COMPONENTS[tab]

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--color-surface, #2C2A35)', fontFamily: '"Courier New", monospace', fontSize: 12 }}>
      {/* Header — like System Properties */}
      <div style={{ padding: '8px 12px', background: '#1a1830', borderBottom: '1px solid #4A4555', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 40, height: 40, background: '#0a0a18', border: '2px inset #4A4555', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
          EC
        </div>
        <div>
          <div style={{ color: '#F0EBE1', fontWeight: 'bold', fontSize: 14 }}>Eric Chemwor</div>
          <div style={{ color: '#A09AB0', fontSize: 10 }}>ChemNet OS v1.0 | Build 050598</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, padding: '0 8px', background: '#1a1830' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '5px 10px',
              border: '1px solid #4A4555',
              borderBottom: tab === t.id ? '1px solid #1e1c28' : '1px solid #4A4555',
              background: tab === t.id ? '#1e1c28' : '#151525',
              color: tab === t.id ? '#FF6B35' : '#888',
              fontSize: 11,
              fontFamily: 'inherit',
              cursor: 'pointer',
              marginBottom: -1,
              borderRadius: '3px 3px 0 0',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px', background: '#1e1c28', borderTop: '1px solid #4A4555' }}>
        <TabContent />
      </div>

      {/* Footer */}
      <div style={{ padding: '4px 12px', background: '#1a1830', borderTop: '1px solid #4A4555', textAlign: 'center', fontSize: 9, color: '#555' }}>
        System uptime: {ERIC_UPTIME_DAYS} days · Kernel: Kenyan-Welsh · Arch: INTJ
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// MOBILE — iOS Settings > About
// ══════════════════════════════════════════

function MobileRow({ label, value, accent, sub }) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', background: '#1c1c1e', borderBottom: '0.5px solid #38383a' }}>
        <span style={{ color: '#fff', fontSize: 15 }}>{label}</span>
        <span style={{ color: accent ? '#FF6B35' : '#8e8e93', fontSize: 15 }}>{value}</span>
      </div>
      {sub && (
        <div style={{ padding: '6px 16px 10px', background: '#1c1c1e', borderBottom: '0.5px solid #38383a' }}>
          <span style={{ color: '#8e8e93', fontSize: 13, lineHeight: 1.4, display: 'block' }}>{sub}</span>
        </div>
      )}
    </>
  )
}

function MobileSectionHeader({ children }) {
  return <div style={{ padding: '24px 16px 6px', fontSize: 13, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: 0.5 }}>{children}</div>
}

function MobileBlockText({ children }) {
  return <div style={{ padding: '10px 16px', background: '#1c1c1e', borderBottom: '0.5px solid #38383a', color: '#ddd', fontSize: 14, lineHeight: 1.5 }}>{children}</div>
}

function MobileGeneralTab() {
  return (
    <>
      <MobileSectionHeader>System Info</MobileSectionHeader>
      <MobileRow label="Name" value="Eric Chemwor" />
      <MobileRow label="Born" value="May 5, 1998" />
      <MobileRow label="Birthplace" value="Wales" />
      <MobileRow label="Ancestry" value="Kenyan & Tanzanian" />
      <MobileRow label="Came to US" value="Age 3" />
      <MobileRow label="US Citizen" value="Age 16" />
      <MobileRow label="Siblings" value="Younger brother" />

      <MobileSectionHeader>Location</MobileSectionHeader>
      <MobileRow label="Grew up" value="Powder Springs, GA" />
      <MobileRow label="Currently" value="Smyrna, GA" />

      <MobileSectionHeader>Preferences</MobileSectionHeader>
      <MobileRow label="Schedule" value="Early bird" />
      <MobileRow label="Morning" value="Green tea" />
      <MobileRow label="Personality" value="INTJ" />
      <MobileRow label="Loves" value="Nature & hiking" />

      <MobileSectionHeader>Dream Jobs (as a kid)</MobileSectionHeader>
      <MobileBlockText>Ninja, astronaut, fireman, pilot</MobileBlockText>

      <MobileSectionHeader>Superstition</MobileSectionHeader>
      <MobileBlockText>Don't look at mirrors at night. Bad energy and spirits.</MobileBlockText>
    </>
  )
}

function MobileHeritageTab() {
  return (
    <>
      <MobileSectionHeader>Ethnic Groups</MobileSectionHeader>
      <MobileRow label="Kalenjin" value="" sub="Highland people of the Rift Valley, western Kenya. Known globally as distance runners." />
      <MobileRow label="Luo" value="" sub="Nilotic people around Lake Victoria. Known for music, academics, and fishing culture." />
      <MobileRow label="Kikuyu" value="" sub="Largest ethnic group in Kenya. Based in the central highlands around Mt. Kenya." />
      <MobileRow label="Chaga" value="" sub="Bantu-speaking people on the slopes of Mt. Kilimanjaro in Tanzania." />

      <MobileSectionHeader>Name Meanings</MobileSectionHeader>
      <MobileRow label="Rotich" value="Kalenjin" accent sub="Means the time of day the cows come back from herding. Middle name, passed down through the Kalenjin side." />

      <MobileSectionHeader>Languages</MobileSectionHeader>
      <MobileRow label="English" value="Primary" />
      <MobileRow label="Swahili" value="Understand, some phrases" sub="Can understand it but can't speak it." />
      <MobileRow label="Kalenjin" value="Don't know it" />

    </>
  )
}

function MobileTrainingTab() {
  return (
    <>
      <MobileSectionHeader>Martial Arts</MobileSectionHeader>
      <MobileRow label="Taekwondo" value="Age 7-16" sub="Georgia state champion, 2012." />
      <MobileRow label="Wrestling" value="4 years" sub="JV captain freshman and sophomore year. Varsity junior year. Varsity captain as a senior." />
      <MobileRow label="BJJ" value="Purple belt" sub="Started at 14 for 2 years. College for a year and a half. Started again at 23 and haven't stopped. Purple belt under Rodrigo Artilheiro." />
      <MobileRow label="Boxing" value="Age 26+" sub="No sparring for now. Preserving the brain." />

      <MobileSectionHeader>Stats</MobileSectionHeader>
      <MobileRow label="Fastest mile" value="4:49" accent />
      <MobileRow label="Favorite sub" value="Baseball choke" />
      <MobileRow label="Favorite takedown" value="Duck under" />
    </>
  )
}

function MobileArtsTab() {
  return (
    <>
      <MobileSectionHeader>Instruments</MobileSectionHeader>
      <MobileRow label="Piano" value="Active" />
      <MobileRow label="Guitar" value="Active" />
      <MobileRow label="Violin" value="Returning" sub="Played 6th through 9th grade. Picking it back up." />

      <MobileSectionHeader>Piano Songs to Learn</MobileSectionHeader>
      <MobileRow label="1" value="Igor's Theme" />
      <MobileRow label="2" value="Congratulations" />
      <MobileRow label="3" value="Heartbeat" />
      <MobileRow label="4" value="La Valse d'Amelie" />
      <MobileRow label="5" value="Gymnopedie No.1" />
      <MobileRow label="6" value="Superstar" />
    </>
  )
}

function MobileMediaTab() {
  return (
    <>
      <MobileSectionHeader>Favorites</MobileSectionHeader>
      <MobileRow label="Show" value="Black Mirror" />
      <MobileRow label="Anime" value="Bleach / Naruto" />
      <MobileRow label="Video game" value="Jet Set Radio Future" accent sub="Have loved it since I was 5. Will love it till the day I die." />
      <MobileRow label="Album" value="Call Me If You Get Lost" />
      <MobileRow label="Genre" value="R&B and chill rap" />

      <MobileSectionHeader>Favorite Song</MobileSectionHeader>
      <MobileRow label="Alright" value="Kendrick Lamar" accent sub="Can lift me up in any mood. Some magic to it." />

      <MobileSectionHeader>Favorite Movie</MobileSectionHeader>
      <MobileRow label="Fight Club" value="" accent sub="A red flag movie on the surface, but read as a commentary on masculinity. Men performing to fit the role society hands them while chasing the next product in a consumer-driven system. It's a green flag." />
    </>
  )
}

function MobileFoodTab() {
  return (
    <>
      <MobileSectionHeader>Top Picks</MobileSectionHeader>
      <MobileRow label="Cuisine" value="Indian" sub="Love the spice work." />
      <MobileRow label="Favorites" value="" accent sub="Chapos, kachumbari, dengu" />

      <MobileSectionHeader>Liked</MobileSectionHeader>
      <MobileBlockText>Wings, pizza (who doesn't), potatoes in any form, chicken tikka masala, samosas, ice cream</MobileBlockText>

      <MobileSectionHeader>Disliked</MobileSectionHeader>
      <MobileBlockText>Strawberries, spinach, ranch, blue cheese, grits</MobileBlockText>

      <MobileSectionHeader>Sweets</MobileSectionHeader>
      <MobileRow label="Candy" value="Wild Berry Skittles" sub="Ms. Walker gave me a pack in 2nd grade for reading the most books in the class during the Pizza Hut challenge. Never forgot it." />
      <MobileRow label="Chocolate" value="Snickers" />
      <MobileRow label="Dessert" value="Red velvet / ice cream" sub="Red velvet cake or ice cream with cake chunks. Mood-dependent." />
      <MobileRow label="Donut" value="Cruller" />
      <MobileRow label="Cookie" value="White choc macadamia" />
      <MobileRow label="Soda" value="Black Currant Fanta" accent />

      <MobileSectionHeader>Spots</MobileSectionHeader>
      <MobileRow label="Butcher" value="Kingship Butcher" accent />
    </>
  )
}

function MobileOddsTab() {
  return (
    <>
      <MobileSectionHeader>Favorites</MobileSectionHeader>
      <MobileRow label="Color" value="Black" />
      <MobileRow label="Animal" value="Crow" />
      <MobileRow label="Smell" value="Vanilla & cinnamon" />
      <MobileRow label="Decor" value="Midcentury modern" />
      <MobileRow label="Stores" value="Best Buy & Guitar Center" />
      <MobileRow label="Team" value="Manchester United" />
      <MobileRow label="Dream car" value="911 GT3" accent />
      <MobileRow label="Luxury spend" value="Tech" sub="Always a new gadget." />
    </>
  )
}

const MOBILE_TAB_COMPONENTS = {
  general: MobileGeneralTab,
  heritage: MobileHeritageTab,
  training: MobileTrainingTab,
  arts: MobileArtsTab,
  media: MobileMediaTab,
  food: MobileFoodTab,
  odds: MobileOddsTab,
}

function MobileAbout() {
  const [tab, setTab] = useState('general')
  const TabContent = MOBILE_TAB_COMPONENTS[tab]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000', fontFamily: '-apple-system, "Helvetica Neue", sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#1c1c1e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#FF6B35', fontWeight: 700, fontFamily: 'monospace' }}>EC</div>
        <div>
          <div style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>Eric Chemwor</div>
          <div style={{ color: '#8e8e93', fontSize: 13 }}>ChemNet OS v1.0</div>
        </div>
      </div>

      {/* Tab picker — scrollable pill bar */}
      <div style={{ padding: '4px 12px 8px', overflowX: 'auto', display: 'flex', gap: 6 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '6px 14px',
              borderRadius: 16,
              border: 'none',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              background: tab === t.id ? '#FF6B35' : '#1c1c1e',
              color: tab === t.id ? '#fff' : '#8e8e93',
              fontFamily: 'inherit',
              flexShrink: 0,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <TabContent />
        <div style={{ height: 40 }} />
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// MEMBER NODES — flexible per-person profile
// ══════════════════════════════════════════
// Eric's flagship About (above) stays bespoke. Member nodes get this template,
// driven by platform.profiles (display_name, tagline, bio, location, links) +
// an auto monogram. Empty fields hide. The owner can edit in place; writes go
// through repo.social.updateMyProfile (RLS: own row only).

const linkLabel = (url) => String(url).replace(/^https?:\/\//, '').replace(/\/+$/, '')
const linkHref = (url) => (/^https?:\/\//.test(url) ? url : `https://${url}`)

// Shared "About ChemNet" explainer — the default/empty state on every member
// node's About. It describes the PLATFORM (never Eric's bio), so an empty
// member profile reads as "this is a ChemNet node" rather than leaking the hub.
const ABOUT_CHEMNET = {
  heading: 'About ChemNet',
  lines: [
    'ChemNet is a personal retro-OS desktop on the web.',
    'Everyone gets their own node at /u/their-handle — theme it, pick which apps show, and fill them with your own posts, photos, reviews, and links.',
    'Want one? Open “Make Your Own” on the hub.',
  ],
}

// Renders the explainer; the owner also gets a nudge to introduce themselves
// (the Edit affordance lives in the header on both skins).
function AboutChemnetEmpty({ isOwner, mobile }) {
  const muted = mobile ? '#8e8e93' : 'var(--color-text-secondary)'
  return (
    <div style={{ padding: mobile ? '28px 24px' : 24, textAlign: 'center', maxWidth: 460, margin: '0 auto' }}>
      <div style={{ fontSize: 30, marginBottom: 8 }}>🛰️</div>
      <div style={{ fontWeight: 'bold', fontSize: mobile ? 17 : 15, marginBottom: 8, color: mobile ? '#fff' : 'var(--color-text-primary)' }}>{ABOUT_CHEMNET.heading}</div>
      {ABOUT_CHEMNET.lines.map((l, i) => (
        <p key={i} style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.6, color: muted }}>{l}</p>
      ))}
      {isOwner && <p style={{ marginTop: 12, fontSize: 13, color: 'var(--color-accent, #0A84FF)' }}>This is your node — hit Edit to introduce yourself.</p>}
    </div>
  )
}

function MemberEdit({ profile, onSave, onCancel, saving, accentText }) {
  const [form, setForm] = useState({
    displayName: profile.display_name || '',
    tagline: profile.tagline || '',
    location: profile.location || '',
    bio: profile.bio || '',
    links: (profile.links || []).join('\n'),
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const field = { width: '100%', padding: '8px 10px', background: 'var(--color-desktop-bg)', color: 'var(--color-text-primary)', border: '1px solid var(--color-bevel-dark)', outline: 'none', fontFamily: 'inherit', fontSize: 13, marginTop: 2 }
  const lbl = { display: 'block', fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 8 }
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, fontFamily: '"Courier Prime", monospace' }}>
      <label style={lbl}>Display name<input value={form.displayName} onChange={e => set('displayName', e.target.value)} maxLength={40} style={field} /></label>
      <label style={lbl}>Tagline<input value={form.tagline} onChange={e => set('tagline', e.target.value)} maxLength={80} style={field} /></label>
      <label style={lbl}>Location<input value={form.location} onChange={e => set('location', e.target.value)} maxLength={60} style={field} /></label>
      <label style={lbl}>Bio<textarea value={form.bio} onChange={e => set('bio', e.target.value)} rows={4} style={{ ...field, resize: 'vertical' }} /></label>
      <label style={lbl}>Links (one per line)<textarea value={form.links} onChange={e => set('links', e.target.value)} rows={3} placeholder="https://…" style={{ ...field, resize: 'vertical' }} /></label>
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button onClick={() => onSave(form)} disabled={saving} style={{ background: 'var(--color-accent)', color: '#1a1207', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: 13, padding: '8px 14px', opacity: saving ? 0.6 : 1, fontFamily: 'inherit' }}>{saving ? 'Saving…' : 'Save'}</button>
        <button onClick={onCancel} style={{ background: 'none', border: '1px solid var(--color-bevel-dark)', color: accentText, cursor: 'pointer', fontSize: 13, padding: '8px 14px', fontFamily: 'inherit' }}>Cancel</button>
      </div>
    </div>
  )
}

// Desktop — iOS-Settings-style list inside the OS window.
function DRow({ label, children }) {
  return (
    <div style={{ display: 'flex', padding: '9px 14px', borderBottom: '1px solid var(--color-bevel-dark)', fontSize: 13 }}>
      <span style={{ color: 'var(--color-text-secondary)', width: 110, flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--color-text-primary)', flex: 1, wordBreak: 'break-word' }}>{children}</span>
    </div>
  )
}

function MemberAboutDesktop({ profile, isOwner, onEdit }) {
  const name = profile.display_name || profile.handle
  const links = profile.links || []
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--color-surface)', fontFamily: '"Courier Prime", monospace', color: 'var(--color-text-primary)' }}>
      <div style={{ padding: '14px 16px', background: 'var(--color-titlebar-active)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <Monogram profile={profile} size={56} square />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 'bold', fontSize: 16 }}>{name}</div>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>@{profile.handle}</div>
          {profile.tagline && <div style={{ color: 'var(--color-accent)', fontSize: 12, marginTop: 2 }}>{profile.tagline}</div>}
        </div>
        {isOwner && <button onClick={onEdit} style={{ marginLeft: 'auto', alignSelf: 'flex-start', background: 'var(--color-accent)', color: '#1a1207', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: 12, padding: '5px 10px', fontFamily: 'inherit' }}>Edit</button>}
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {profile.bio && <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--color-bevel-dark)', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{profile.bio}</div>}
        {profile.location && <DRow label="Location">{profile.location}</DRow>}
        {links.map((l, i) => (
          <DRow key={i} label={i === 0 ? 'Links' : ''}><a href={linkHref(l)} target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent)' }}>{linkLabel(l)}</a></DRow>
        ))}
        {!profile.bio && !profile.location && !links.length && (
          <AboutChemnetEmpty isOwner={isOwner} />
        )}
      </div>
    </div>
  )
}

// Mobile — Apple-ID-style header + grouped sections.
function MemberAboutMobile({ profile, isOwner, onEdit }) {
  const name = profile.display_name || profile.handle
  const links = profile.links || []
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000', fontFamily: '-apple-system, "Helvetica Neue", sans-serif', color: '#fff' }}>
      {isOwner && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 16px 0' }}>
          <button onClick={onEdit} style={{ background: 'none', border: 'none', color: 'var(--color-accent, #0A84FF)', fontSize: 16, fontFamily: 'inherit', cursor: 'pointer' }}>Edit</button>
        </div>
      )}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px 24px', textAlign: 'center' }}>
          <Monogram profile={profile} size={84} />
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 12 }}>{name}</div>
          <div style={{ color: '#8e8e93', fontSize: 15 }}>@{profile.handle}</div>
          {profile.tagline && <div style={{ color: 'var(--color-accent, #0A84FF)', fontSize: 15, marginTop: 6 }}>{profile.tagline}</div>}
        </div>
        {profile.bio && (
          <>
            <div style={{ padding: '20px 16px 6px', fontSize: 13, color: '#8e8e93', textTransform: 'uppercase' }}>Bio</div>
            <div style={{ padding: '12px 16px', background: '#1c1c1e', color: '#ddd', fontSize: 15, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{profile.bio}</div>
          </>
        )}
        {(profile.location || links.length > 0) && (
          <>
            <div style={{ padding: '20px 16px 6px', fontSize: 13, color: '#8e8e93', textTransform: 'uppercase' }}>Details</div>
            {profile.location && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#1c1c1e', borderBottom: '0.5px solid #38383a', fontSize: 15 }}>
                <span>Location</span><span style={{ color: '#8e8e93' }}>{profile.location}</span>
              </div>
            )}
            {links.map((l, i) => (
              <a key={i} href={linkHref(l)} target="_blank" rel="noreferrer" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#1c1c1e', borderBottom: '0.5px solid #38383a', fontSize: 15, textDecoration: 'none', color: 'var(--color-accent, #0A84FF)' }}>
                <span>{linkLabel(l)}</span><span>›</span>
              </a>
            ))}
          </>
        )}
        {!profile.bio && !profile.location && !links.length && (
          <AboutChemnetEmpty isOwner={isOwner} mobile />
        )}
        <div style={{ height: 40 }} />
      </div>
    </div>
  )
}

function MemberAbout({ isMobile }) {
  const { node, isOwner } = useProfile()
  const repo = useRepo()
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const p = await repo.social.directory.resolveHandle(node.handle)
    setProfile(p)
  }, [repo, node.handle])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  const save = async (form) => {
    setSaving(true)
    await repo.social.updateMyProfile({
      display_name: form.displayName.trim() || null,
      tagline: form.tagline.trim() || null,
      location: form.location.trim() || null,
      bio: form.bio.trim() || null,
      links: form.links.split(/[\n,]+/).map(s => s.trim()).filter(Boolean),
    })
    setSaving(false)
    setEditing(false)
    load()
  }

  if (!profile) {
    return <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isMobile ? '#000' : 'var(--color-surface)', color: 'var(--color-text-secondary)', fontFamily: '"Courier Prime", monospace', fontSize: 13 }}>Loading profile…</div>
  }

  if (editing) {
    const frame = isMobile
      ? { position: 'absolute', inset: 0, background: '#000', color: '#fff', overflow: 'auto' }
      : { position: 'absolute', inset: 0, background: 'var(--color-surface)', color: 'var(--color-text-primary)', overflow: 'auto' }
    return (
      <div style={frame}>
        <MemberEdit profile={profile} onSave={save} onCancel={() => setEditing(false)} saving={saving} accentText={isMobile ? '#fff' : 'var(--color-text-primary)'} />
      </div>
    )
  }

  return isMobile
    ? <MemberAboutMobile profile={profile} isOwner={isOwner} onEdit={() => setEditing(true)} />
    : <MemberAboutDesktop profile={profile} isOwner={isOwner} onEdit={() => setEditing(true)} />
}

export default function AboutMe() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const { node } = useProfile()
  // Flagship keeps Eric's bespoke About; member nodes get the flexible template.
  if (node.kind === 'member') return <MemberAbout isMobile={isMobile} />
  return isMobile ? <MobileAbout /> : <DesktopAbout />
}

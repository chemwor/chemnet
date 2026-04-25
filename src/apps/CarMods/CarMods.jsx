import { useState, useEffect } from 'react'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { supabase } from '../../lib/supabase'

const PROJECT = {
  name: 'The Camaro',
  car: '2016 Chevrolet Camaro LT V6 (3.6L LGX)',
  vin: '1G1FB1RS9G0146608',
  miles: '106,557 mi',
  icon: '🏎️',
  notes: 'LT trim, RWD coupe. Building it into an SS-level daily over time. Phase by phase.',
}

const PHASES = [
  {
    id: 'repairs',
    label: '🔧 Catch-Up Repairs',
    mods: [
      { name: 'Spark Plugs (V6 LGX)', status: 'done', cost: '$40–200', priority: 'HIGH', notes: 'Done.', link: 'https://www.youtube.com/watch?v=SErRFQspaZ4' },
      { name: 'Wheel Alignment', status: 'planned', cost: '$80–130', priority: 'MEDIUM', notes: 'Last done at 26k mi — 80k miles ago. New wheels/tires deserve a fresh one.' },
      { name: 'BG GDI Air Induction Service', status: 'researching', cost: 'TBD', priority: 'MEDIUM', notes: 'Carbon buildup cleaning for direct injection engine.' },
    ],
  },
  {
    id: 'phase1',
    label: '⚡ Phase 1 — Do Now',
    mods: [
      { name: 'Cat-Back Exhaust', status: 'planned', cost: '$400–900', priority: '#1', notes: 'Biggest immediate transformation — sound + feel. Looking at Borla, Corsa, or Axle-back.' },
      { name: 'Brakes + Rotors Replaced', status: 'done', cost: '$80–150', priority: '#2', notes: 'Done at R&E Motors. Pads and rotors swapped together for a clean reset before any of the performance mods. Pairs with the red caliper covers — fresh rotors look right behind them.' },
      { name: 'Slotted/Drilled Rotors', status: 'planned', cost: '$150–300', priority: '#2', notes: 'Pair with pads — same job. PowerStop or EBC.' },
      { name: 'Window Tint', status: 'planned', cost: '$150–250', priority: 'EASY WIN', notes: 'Easy visual win, immediate premium look. 35% or 20%.' },
      { name: 'Black Badge Delete', status: 'planned', cost: '$20–50', priority: 'EASY WIN', notes: 'Cheapest visual upgrade possible. 3M wrap or OEM badges.' },
      { name: 'LED Side Markers / Turn Signals', status: 'done', cost: '$60–120', priority: 'EASY WIN', notes: 'Done. White LEDs replacing the OEM amber. Install was simple and basic — fronts went in fast. Rears were a fight without removing the wheels; eventually pulled them for clean access.' },
      { name: 'Brake Caliper Covers (Red)', status: 'done', cost: '$60–150', priority: 'EASY WIN', notes: 'Done. Bright red covers over the stock calipers. The kit came bare, so added a Brembo-style sticker to give it more of a design element. Install wasn\'t too difficult — just needed the car jacked and the wheels off.' },
    ],
  },
  {
    id: 'phase2',
    label: '🔧 Phase 2 — Next 3–6 Months',
    mods: [
      { name: 'Cold Air Intake', status: 'planned', cost: '$250–350', priority: '#3', notes: 'Pairs with exhaust — completes intake/exhaust combo. K&N or Injen.' },
      { name: 'Lowering Springs', status: 'planned', cost: '$200–350', priority: '#4', notes: 'Drops 1–1.5". Stance + handling in one shot. Eibach or H&R.' },
      { name: 'Alignment (post-lowering)', status: 'planned', cost: '$80–130', priority: 'REQUIRED', notes: 'Critical after any suspension work — do not skip.' },
      { name: 'Stainless Brake Lines', status: 'planned', cost: '$80–120', priority: 'MID', notes: 'Hardens pedal feel — pairs with earlier brake work. Goodridge or Russell.' },
    ],
  },
  {
    id: 'phase3',
    label: '🎨 Phase 3 — 6–12 Months',
    mods: [
      { name: 'Wheels Upgrade (20")', status: 'planned', cost: '$800–1,500', priority: '#5', notes: 'Biggest visual jump — save up for this one.' },
      { name: 'Bilstein B6 Shocks/Struts', status: 'done', cost: '$400–600', priority: 'MID', notes: 'Done.' },
      { name: 'ECU Tune', status: 'planned', cost: '$300–500', priority: 'MID', notes: 'After intake + exhaust — gets full benefit. HP Tuners.' },
      { name: 'Sway Bar Upgrade', status: 'planned', cost: '$150–300', priority: 'MID', notes: 'Reduces body roll, tighter cornering. Whiteline or Eibach.' },
    ],
  },
  {
    id: 'interior',
    label: '🪑 Interior Mods',
    mods: [
      { name: 'Custom Leather Seat Covers', status: 'planned', cost: '$469–850', priority: 'HIGH IMPACT', notes: 'Precision fit for 2016+ Camaro Coupe. Compatible with seat heaters and airbags. Multiple color options.', link: 'https://kustominterior.com/collections/chevrolet-camaro-interior-parts-accessories/products/2016-chevrolet-camaro-coupe-seat-covers' },
      { name: 'Leather Knee Pads Cover Kit (4pc)', status: 'planned', cost: '$129.99', priority: 'HIGH IMPACT', notes: 'Premium leather over factory area. Center console + door knee pads. OEM-style fitment.', link: 'https://kustominterior.com/collections/chevrolet-camaro-interior-parts-accessories/products/6th-gen-camaro-leather-knee-pads-cover-kit-interior-trim' },
      { name: 'Witamats Diamond Line Galaxy Floor Mats', status: 'ordered', cost: '$199.95', priority: 'PRACTICAL', notes: 'Ordered. Custom-fit microfiber leather. Waterproof, extended coverage wraps up the sides. Dual-layer cushion.', link: 'https://witamats.com/products/witamats-diamond-line-galaxy/' },
      { name: 'Husky WeatherBeater Trunk Liner', status: 'planned', cost: '$107.99', priority: 'PRACTICAL', notes: 'Protect that trunk.', link: 'https://www.americanmuscle.com/husky-camaro-weatherbeater-trunk-liner-black-42091.html' },
      { name: 'BloomCar LED Door Sill Pro', status: 'planned', cost: '$69.99', priority: 'NICE', notes: 'LED light-up door sills. Custom fit for Camaro.', link: 'https://thebloomcar.com/products/bloomcar-led-light-pedal' },
      { name: 'CF Gear Shifter Console Trim', status: 'planned', cost: '$84.99', priority: 'HIGH IMPACT', notes: 'Carbon fiber. NextGenSpeed.', link: 'https://nextgenspeed.com/shop/chevy/chevycamaro/2019-camaro/interior-parts-2019/genuine-carbon-fiber/carbon-fiber-gear-shifter-trim-cover-2016-2020-camaro/' },
      { name: 'CF Air Vent Bezel Cover', status: 'planned', cost: '$76.99', priority: 'HIGH IMPACT', notes: 'Carbon fiber. NextGenSpeed.', link: 'https://nextgenspeed.com/shop/chevy/chevycamaro/2019-camaro/interior-parts-2019/genuine-carbon-fiber/carbon-fiber-air-vent-bezel-cover-2016-2021-chevy-camaro/' },
      { name: 'CF Radio Trim Surround', status: 'planned', cost: '$84.99', priority: 'HIGH IMPACT', notes: 'Carbon fiber 8" radio trim. NextGenSpeed.', link: 'https://nextgenspeed.com/shop/chevy/chevycamaro/2019-camaro/interior-parts-2019/genuine-carbon-fiber/next-gen-carbon-fiber-8-radio-trim-cover-2016-2020-camaro/' },
      { name: 'CF Steering Wheel', status: 'researching', cost: '$599–1,099', priority: 'SPLURGE', notes: 'Carbon fiber with ergonomic grips, premium stitching. LED display options available.', link: 'https://kustominterior.com/collections/chevrolet-camaro-interior-parts-accessories/products/6th-gen-camaro-carbon-fiber-steering-wheel' },
      { name: 'SpeedForm Pedal Covers', status: 'planned', cost: '$31.99', priority: 'NICE', notes: 'Stainless steel. AmericanMuscle.', link: 'https://www.americanmuscle.com/speedform-camaro-pedal-covers-stainless-steel-cc20834.html' },
      { name: 'CF Push Start Button Cover', status: 'planned', cost: '$22.99', priority: 'NICE', notes: 'Small detail, big feel.', link: 'https://nextgenspeed.com/shop/chevy/chevycamaro/2019-camaro/interior-parts-2019/genuine-carbon-fiber/carbon-fiber-push-start-button-cover-black-red-2016-2020-chevy-camaro/' },
      { name: 'CF Door Sill Covers', status: 'planned', cost: '$44.99', priority: 'NICE', notes: 'NextGenSpeed.', link: 'https://nextgenspeed.com/shop/chevy/chevycamaro/2019-camaro/interior-parts-2019/genuine-carbon-fiber/real-carbon-fiber-door-sill-covers-2016-2020-camaro/' },
      { name: 'CF Window Switch Panels', status: 'planned', cost: '$47.99', priority: 'NICE', notes: 'NextGenSpeed.', link: 'https://nextgenspeed.com/shop/chevy/chevycamaro/2019-camaro/interior-parts-2019/hydro-carbon-interior-parts-2019/carbon-fiber-window-switch-panels-2016-2019-camaro/' },
      { name: 'Dead Pedal Trim Plate', status: 'planned', cost: '$39.59', priority: 'NICE', notes: 'Brushed finish. AmericanMuscle.', link: 'https://www.americanmuscle.com/camaro-dead-pedal-trim-plate-brushed-101062.html' },
      { name: 'CF Upper Console / Light Cover', status: 'planned', cost: '$34.99', priority: 'NICE', notes: 'Genuine carbon fiber. NextGenSpeed.', link: 'https://nextgenspeed.com/shop/chevy/chevycamaro/2019-camaro/interior-parts-2019/genuine-carbon-fiber/next-gen-carbon-fiber-upper-console-light-cover-2016-2020-camaro/' },
      { name: 'CF Interior Door Handle Trim', status: 'planned', cost: '$42.99', priority: 'NICE', notes: 'Hydro carbon. NextGenSpeed.', link: 'https://nextgenspeed.com/shop/chevy/chevycamaro/2019-camaro/interior-parts-2019/hydro-carbon-interior-parts-2019/carbon-fiber-interior-door-panels-2016-18-camaro-lt-rs-ss-zl1/' },
      { name: 'CF Center Console Compartment Overlay', status: 'planned', cost: '$44.99', priority: 'NICE', notes: 'Genuine carbon fiber. NextGenSpeed.', link: 'https://nextgenspeed.com/shop/chevy/chevycamaro/2019-camaro/interior-parts-2019/genuine-carbon-fiber/camaro-real-carbon-fiber-center-console-compartment-overlay-cover/' },
    ],
  },
  {
    id: 'exterior',
    label: '🎨 Exterior Mods',
    mods: [
      { name: 'ZL1 1LE Front Bumper Conversion', status: 'planned', cost: '$945', priority: 'HIGH IMPACT', notes: '9-piece full kit flat black. AutoAddictUSA.', link: 'https://autoaddictusa.com/products/2016-2018-chevy-camaro-zl1-1le-front-bumper-conversion-9-pieces-full-kit-flat-blk' },
      { name: 'OEM Replica Sequential LED Headlights', status: 'planned', cost: '$598.74', priority: 'HIGH IMPACT', notes: 'AutoAddictUSA.', link: 'https://autoaddictusa.com/products/2016-2018-camaro-oem-led-headlights' },
      { name: 'ZL1 Style Rear Spoiler (Gloss Black)', status: 'planned', cost: '$324.99', priority: 'HIGH IMPACT', notes: 'AmericanMuscle.', link: 'https://www.americanmuscle.com/camaro-zl1-style-rear-spoiler-gloss-black-vz102181.html' },
      { name: 'SS-Style Front Splitter', status: 'planned', cost: '$150–300', priority: 'MID', notes: 'Aggressive lower front. RPI Designs or ACS.' },
      { name: 'LED Rear Marker Lights (Red)', status: 'planned', cost: '$44.99', priority: 'NICE', notes: 'Raxiom Axial Series. Razor sharp LED strip, no cutting/splicing. Plug and play.', link: 'https://www.americanmuscle.com/axial-camaro-led-rear-marker-lights-red-cc14391.html' },
      { name: 'LED Third Brake Light (Smoked)', status: 'planned', cost: '$59.99', priority: 'NICE', notes: 'Raxiom Axial Series. Super bright red LEDs, smoked lens. 15 min plug and play install.', link: 'https://www.americanmuscle.com/axial-camaro-led-third-brake-light-smoked-cc2930.html' },
      { name: '1LE Style Side Skirts (Gloss Black)', status: 'planned', cost: '$204.99', priority: 'MID', notes: 'Rocker panel extensions. Durable ABS plastic, no-drill install. All hardware included.', link: 'https://www.americanmuscle.com/camaro-1le-style-side-skirts-gloss-black-ss-441-v2-abs.html' },
    ],
  },
]

const PHOTO_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'exterior', label: 'Exterior' },
  { id: 'interior', label: 'Interior' },
  { id: 'engine', label: 'Engine' },
  { id: 'before', label: 'Before' },
  { id: 'after', label: 'After' },
  { id: 'progress', label: 'Progress' },
]

// Photos will load from Supabase Storage bucket 'car-photos'
function useCarPhotos() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase.storage.from('car-photos').list('', { limit: 100 })
        if (!error && data) {
          const photoList = data
            .filter(f => f.name.match(/\.(jpg|jpeg|png|webp|gif)$/i))
            .map(f => {
              const { data: urlData } = supabase.storage.from('car-photos').getPublicUrl(f.name)
              // Parse category from filename: "exterior_front-angle.jpg" → "exterior"
              const cat = f.name.split('_')[0]
              const validCat = PHOTO_CATEGORIES.find(c => c.id === cat) ? cat : 'all'
              return {
                name: f.name,
                url: urlData.publicUrl,
                category: validCat,
                date: f.created_at,
              }
            })
          setPhotos(photoList)
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  return { photos, loading }
}

// ── Desktop Photo Gallery ──
function DesktopPhotoGallery() {
  const { photos, loading } = useCarPhotos()
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  const filtered = filter === 'all' ? photos : photos.filter(p => p.category === filter)

  return (
    <div className="flex-1 overflow-auto">
      {/* Filter bar */}
      <div className="flex gap-1 px-3 py-1.5" style={{ borderBottom: '1px solid #2a2a3a' }}>
        {PHOTO_CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            className="px-1.5 py-0.5 text-xs border-none cursor-pointer"
            style={{ background: filter === c.id ? '#FF6B35' : 'transparent', color: filter === c.id ? '#000' : '#555', fontFamily: 'monospace' }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs" style={{ color: '#555' }}>Loading photos...</div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center" style={{ color: '#555' }}>
          <div className="text-2xl mb-2">📷</div>
          <div className="text-xs mb-1">No photos yet</div>
          <div className="text-xs" style={{ color: '#444' }}>
            Upload to the "car-photos" bucket in Supabase Storage.
            <br />Name files like: exterior_front.jpg, interior_dash.jpg, before_stock.jpg
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-1 p-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
            {filtered.map((photo, i) => (
              <div
                key={i}
                onClick={() => setSelected(photo)}
                className="cursor-pointer"
                style={{ aspectRatio: '1', borderRadius: 4, overflow: 'hidden', border: selected?.name === photo.name ? '2px solid #FF6B35' : '2px solid transparent' }}
              >
                <img src={photo.url} alt={photo.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>

          {/* Lightbox */}
          {selected && (
            <div
              onClick={() => setSelected(null)}
              style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <img src={selected.url} alt={selected.name} style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: 4 }} />
              <div style={{ position: 'absolute', bottom: 20, color: '#888', fontSize: 11, fontFamily: 'monospace' }}>
                {selected.name} · {selected.category} · Click to close
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Mobile Photo Gallery ──
function MobilePhotoGallery() {
  const { photos, loading } = useCarPhotos()
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  const filtered = filter === 'all' ? photos : photos.filter(p => p.category === filter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000' }}>
      {/* Filter */}
      <div style={{ padding: '8px 12px', overflowX: 'auto', display: 'flex', gap: 6, background: '#111', borderBottom: '0.5px solid #333' }}>
        {PHOTO_CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            className="border-none cursor-pointer shrink-0"
            style={{ padding: '4px 10px', borderRadius: 14, fontSize: 12, background: filter === c.id ? '#FF6B35' : '#222', color: filter === c.id ? '#000' : '#888', fontFamily: '-apple-system, sans-serif' }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: 14 }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📷</div>
          <div style={{ fontSize: 15, color: '#888', fontFamily: '-apple-system, sans-serif' }}>No photos yet</div>
          <div style={{ fontSize: 12, color: '#555', marginTop: 4, fontFamily: '-apple-system, sans-serif' }}>Photos will appear here</div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto" style={{ padding: 2 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            {filtered.map((photo, i) => (
              <div
                key={i}
                onClick={() => setSelected(photo)}
                style={{ aspectRatio: '1', overflow: 'hidden' }}
              >
                <img src={photo.url} alt={photo.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen view */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
        >
          <img src={selected.url} alt={selected.name} style={{ maxWidth: '100%', maxHeight: '85%', objectFit: 'contain' }} />
          <div style={{ position: 'absolute', bottom: 40, color: '#888', fontSize: 12, fontFamily: '-apple-system, sans-serif' }}>
            Tap to close
          </div>
        </div>
      )}
    </div>
  )
}

const STATUS_COLORS = {
  done: { bg: '#1a3a1a', color: '#4ADE80', label: 'DONE' },
  planned: { bg: '#1a1a3a', color: '#60A5FA', label: 'PLANNED' },
  researching: { bg: '#3a2a1a', color: '#FBBF24', label: 'RESEARCH' },
  'in-progress': { bg: '#3a1a1a', color: '#FF6B35', label: 'IN PROGRESS' },
  ordered: { bg: '#2a1a3a', color: '#A78BFA', label: 'ORDERED' },
}

// ── Desktop View ──
function DesktopCarMods() {
  const [tab, setTab] = useState('mods') // mods | photos
  const [activePhase, setActivePhase] = useState('phase1')
  const phase = PHASES.find(p => p.id === activePhase)

  const totalAll = PHASES.flatMap(p => p.mods).length
  const doneAll = PHASES.flatMap(p => p.mods).filter(m => m.status === 'done').length

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#0f0f14', fontFamily: 'monospace', color: '#F0EBE1' }}>
      <div className="px-3 py-2 shrink-0" style={{ background: '#1a1a24', borderBottom: '1px solid #2a2a3a' }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{PROJECT.icon}</span>
          <div>
            <div className="font-bold text-sm">{PROJECT.name}</div>
            <div className="text-xs" style={{ color: '#888' }}>{PROJECT.car}</div>
          </div>
          <div className="flex gap-1 ml-auto">
            <button onClick={() => setTab('mods')} className="px-2 py-0.5 text-xs border-none cursor-pointer" style={{ background: tab === 'mods' ? '#FF6B35' : '#1a1a2a', color: tab === 'mods' ? '#000' : '#666', fontFamily: 'monospace' }}>🔧 Mods</button>
            <button onClick={() => setTab('photos')} className="px-2 py-0.5 text-xs border-none cursor-pointer" style={{ background: tab === 'photos' ? '#FF6B35' : '#1a1a2a', color: tab === 'photos' ? '#000' : '#666', fontFamily: 'monospace' }}>📷 Photos</button>
          </div>
        </div>
      </div>

      {tab === 'photos' ? <DesktopPhotoGallery /> : (
      <>

      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {/* Phase sidebar */}
        <div className="shrink-0 overflow-auto" style={{ width: 160, background: '#12121a', borderRight: '1px solid #2a2a3a' }}>
          {PHASES.map(p => (
            <div
              key={p.id}
              onClick={() => setActivePhase(p.id)}
              className="px-2 py-2 cursor-pointer text-xs"
              style={{ background: activePhase === p.id ? '#1a1a3a' : 'transparent', borderBottom: '1px solid #1a1a1a', color: activePhase === p.id ? '#F0EBE1' : '#888' }}
            >
              {p.label}
              <div style={{ color: '#555', fontSize: 9, marginTop: 2 }}>{p.mods.length} items</div>
            </div>
          ))}
        </div>

        {/* Mod list */}
        <div className="flex-1 overflow-auto">
          {phase?.mods.map((mod, i) => {
            const st = STATUS_COLORS[mod.status] || STATUS_COLORS.planned
            return (
              <div key={i} className="flex items-start gap-2 px-3 py-2" style={{ borderBottom: '1px solid #1a1a1a' }}>
                <span className="text-xs px-1.5 py-0.5 shrink-0 mt-0.5" style={{ background: st.bg, color: st.color, fontSize: 8 }}>{st.label}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold" style={{ color: '#F0EBE1' }}>{mod.name}</span>
                    <span className="text-xs shrink-0" style={{ color: '#888' }}>{mod.cost}</span>
                  </div>
                  {mod.priority && <span className="text-xs" style={{ color: '#FF6B35' }}>{mod.priority}</span>}
                  {mod.notes && <div className="text-xs mt-0.5" style={{ color: '#666', lineHeight: 1.4 }}>{mod.notes}</div>}
                  {mod.link && <a href={mod.link} target="_blank" rel="noopener noreferrer" className="text-xs mt-1 block" style={{ color: '#4A90D9' }}>🔗 View Part</a>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      </>
      )}

      <div className="px-3 py-1.5 shrink-0" style={{ background: '#12121a', borderTop: '1px solid #2a2a3a' }}>
        <div className="text-xs" style={{ color: '#555' }}>{PROJECT.miles} · {doneAll}/{totalAll} mods</div>
      </div>
    </div>
  )
}

// ── Mobile View ──
function MobileCarMods() {
  const [activePhase, setActivePhase] = useState(null)
  const phase = PHASES.find(p => p.id === activePhase)

  if (activePhase === 'photos') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000', fontFamily: '-apple-system, "Helvetica Neue", sans-serif' }}>
        <div className="flex items-center px-3 shrink-0" style={{ height: 44, borderBottom: '0.5px solid #333', background: '#111' }}>
          <button onClick={() => setActivePhase(null)} className="border-none bg-transparent cursor-pointer" style={{ color: '#007AFF', fontSize: 15, fontFamily: 'inherit' }}>‹ Back</button>
          <span className="flex-1 text-center" style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Photos</span>
          <div style={{ width: 40 }} />
        </div>
        <MobilePhotoGallery />
      </div>
    )
  }

  if (phase) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f2f2f7', fontFamily: '-apple-system, "Helvetica Neue", sans-serif' }}>
        <div className="flex items-center px-3 shrink-0" style={{ height: 44, borderBottom: '0.5px solid #e5e5ea', background: '#fff' }}>
          <button onClick={() => setActivePhase(null)} className="border-none bg-transparent cursor-pointer" style={{ color: '#007AFF', fontSize: 15, fontFamily: 'inherit' }}>‹ Back</button>
          <span className="flex-1 text-center truncate" style={{ fontSize: 15, fontWeight: 600, padding: '0 40px' }}>{phase.label}</span>
        </div>
        <div className="flex-1 overflow-auto">
          {phase.mods.map((mod, i) => (
            <div key={i} style={{ padding: '12px 16px', background: '#fff', borderBottom: '0.5px solid #e5e5ea' }}>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 15, fontWeight: 600 }}>{mod.name}</span>
                <span style={{ fontSize: 13, color: '#007AFF' }}>{mod.cost}</span>
              </div>
              {mod.priority && <div style={{ fontSize: 11, color: '#FF9500', marginTop: 2 }}>{mod.priority}</div>}
              {mod.notes && <div style={{ fontSize: 13, color: '#8e8e93', marginTop: 4, lineHeight: 1.4 }}>{mod.notes}</div>}
              <div className="flex items-center gap-3" style={{ marginTop: 4 }}>
                <span style={{ fontSize: 11, color: mod.status === 'done' ? '#34C759' : mod.status === 'in-progress' ? '#FF6B35' : mod.status === 'ordered' ? '#A78BFA' : mod.status === 'researching' ? '#FF9500' : '#007AFF' }}>
                  {mod.status === 'done' ? '✓ Done' : mod.status === 'in-progress' ? '⚡ In Progress' : mod.status === 'ordered' ? '📦 Ordered' : mod.status === 'researching' ? '🔍 Researching' : '○ Planned'}
                </span>
                {mod.link && <a href={mod.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#007AFF' }}>View Part →</a>}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f2f2f7', fontFamily: '-apple-system, "Helvetica Neue", sans-serif' }}>
      {/* Car info */}
      <div style={{ padding: '16px', background: '#fff', borderBottom: '0.5px solid #e5e5ea', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 4 }}>{PROJECT.icon}</div>
        <div style={{ fontSize: 17, fontWeight: 600 }}>{PROJECT.name}</div>
        <div style={{ fontSize: 13, color: '#8e8e93', marginTop: 2 }}>{PROJECT.car}</div>
        <div style={{ fontSize: 12, color: '#8e8e93', marginTop: 2 }}>{PROJECT.miles}</div>
      </div>

      {/* Phase list */}
      <div className="flex-1 overflow-auto" style={{ paddingTop: 8 }}>
        {PHASES.map(p => {
          const done = p.mods.filter(m => m.status === 'done').length
          return (
            <div key={p.id} onClick={() => setActivePhase(p.id)} style={{ padding: '14px 16px', background: '#fff', borderBottom: '0.5px solid #e5e5ea', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{p.label}</div>
                <div style={{ fontSize: 12, color: '#8e8e93', marginTop: 2 }}>{done}/{p.mods.length} complete · {p.mods.length} items</div>
              </div>
              <span style={{ color: '#c7c7cc', fontSize: 16 }}>›</span>
            </div>
          )
        })}

        {/* Photos entry */}
        <div style={{ padding: '4px 16px 0', fontSize: 11, color: '#8e8e93', fontWeight: 600, textTransform: 'uppercase', marginTop: 8 }}>Gallery</div>
        <div onClick={() => setActivePhase('photos')} style={{ padding: '14px 16px', background: '#fff', borderBottom: '0.5px solid #e5e5ea', display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>📷 Photos</div>
            <div style={{ fontSize: 12, color: '#8e8e93', marginTop: 2 }}>Before & after, progress, detail shots</div>
          </div>
          <span style={{ color: '#c7c7cc', fontSize: 16 }}>›</span>
        </div>
      </div>
    </div>
  )
}

export default function CarMods() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  return isMobile ? <MobileCarMods /> : <DesktopCarMods />
}

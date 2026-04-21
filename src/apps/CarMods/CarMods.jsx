import { useState } from 'react'
import { useMediaQuery } from '../../hooks/useMediaQuery'

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
      { name: 'Spark Plugs (V6 LGX)', status: 'planned', cost: '$40–200', priority: 'HIGH', notes: '108k on likely original plugs — past spec interval for this engine.' },
      { name: 'Wheel Alignment', status: 'planned', cost: '$80–130', priority: 'MEDIUM', notes: 'Last done at 26k mi — 80k miles ago. New wheels/tires deserve a fresh one.' },
      { name: 'BG GDI Air Induction Service', status: 'researching', cost: 'TBD', priority: 'MEDIUM', notes: 'Carbon buildup cleaning for direct injection engine.' },
    ],
  },
  {
    id: 'phase1',
    label: '⚡ Phase 1 — Do Now',
    mods: [
      { name: 'Cat-Back Exhaust', status: 'planned', cost: '$400–900', priority: '#1', notes: 'Biggest immediate transformation — sound + feel. Looking at Borla, Corsa, or Axle-back.' },
      { name: 'Hawk HPS Brake Pads', status: 'planned', cost: '$80–150', priority: '#2', notes: 'Doing brake job anyway — upgrade while in there.' },
      { name: 'Slotted/Drilled Rotors', status: 'planned', cost: '$150–300', priority: '#2', notes: 'Pair with pads — same job. PowerStop or EBC.' },
      { name: 'Window Tint', status: 'planned', cost: '$150–250', priority: 'EASY WIN', notes: 'Easy visual win, immediate premium look. 35% or 20%.' },
      { name: 'Black Badge Delete', status: 'planned', cost: '$20–50', priority: 'EASY WIN', notes: 'Cheapest visual upgrade possible. 3M wrap or OEM badges.' },
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
      { name: 'Bilstein B6 Shocks/Struts', status: 'planned', cost: '$400–600', priority: 'MID', notes: 'Pair with lowering springs for full suspension upgrade.' },
      { name: 'ECU Tune', status: 'planned', cost: '$300–500', priority: 'MID', notes: 'After intake + exhaust — gets full benefit. HP Tuners.' },
      { name: 'Sway Bar Upgrade', status: 'planned', cost: '$150–300', priority: 'MID', notes: 'Reduces body roll, tighter cornering. Whiteline or Eibach.' },
    ],
  },
  {
    id: 'interior',
    label: '🪑 Interior Mods',
    mods: [
      { name: 'Premium Leatherette Seat Covers', status: 'planned', cost: '$520', priority: 'HIGH IMPACT', notes: 'Front & rear. All black honeycomb. AmericanMuscle.' },
      { name: 'TruShield Floor Liners', status: 'planned', cost: '$99.99', priority: 'PRACTICAL', notes: 'Front & rear precision molded. Black.' },
      { name: 'Husky WeatherBeater Trunk Liner', status: 'planned', cost: '$107.99', priority: 'PRACTICAL', notes: 'Protect that trunk.' },
      { name: 'CF Gear Shifter Console Trim', status: 'planned', cost: '$84.99', priority: 'HIGH IMPACT', notes: 'Carbon fiber. NextGenSpeed.' },
      { name: 'CF Air Vent Bezel Cover', status: 'planned', cost: '$76.99', priority: 'HIGH IMPACT', notes: 'Carbon fiber. NextGenSpeed.' },
      { name: 'CF Radio Trim Surround', status: 'planned', cost: '$84.99', priority: 'HIGH IMPACT', notes: 'Carbon fiber 8" radio trim. NextGenSpeed.' },
      { name: 'Custom CF Steering Wheel', status: 'researching', cost: '$1,065.99', priority: 'SPLURGE', notes: 'The big one. AutoAddictUSA.' },
      { name: 'SpeedForm Pedal Covers', status: 'planned', cost: '$31.99', priority: 'NICE', notes: 'Stainless steel. AmericanMuscle.' },
      { name: 'CF Push Start Button Cover', status: 'planned', cost: '$22.99', priority: 'NICE', notes: 'Small detail, big feel.' },
      { name: 'CF Door Sill Covers', status: 'planned', cost: '$44.99', priority: 'NICE', notes: 'NextGenSpeed.' },
      { name: 'CF Window Switch Panels', status: 'planned', cost: '$47.99', priority: 'NICE', notes: 'NextGenSpeed.' },
    ],
  },
  {
    id: 'exterior',
    label: '🎨 Exterior Mods',
    mods: [
      { name: 'ZL1 1LE Front Bumper Conversion', status: 'planned', cost: '$945', priority: 'HIGH IMPACT', notes: '9-piece full kit flat black. AutoAddictUSA.' },
      { name: 'OEM Replica Sequential LED Headlights', status: 'planned', cost: '$598.74', priority: 'HIGH IMPACT', notes: 'AutoAddictUSA.' },
      { name: 'ZL1 Style Rear Spoiler (Gloss Black)', status: 'planned', cost: '$324.99', priority: 'HIGH IMPACT', notes: 'AmericanMuscle.' },
      { name: 'SS-Style Front Splitter', status: 'planned', cost: '$150–300', priority: 'MID', notes: 'Aggressive lower front. RPI Designs or ACS.' },
      { name: 'LED Rear Marker Lights (Red)', status: 'planned', cost: 'TBD', priority: 'NICE', notes: 'Axial. AmericanMuscle.' },
      { name: 'LED Third Brake Light (Smoked)', status: 'planned', cost: 'TBD', priority: 'NICE', notes: 'Axial. AmericanMuscle.' },
      { name: '1LE Side Skirts (Gloss Black)', status: 'planned', cost: 'TBD', priority: 'MID', notes: 'AmericanMuscle.' },
    ],
  },
]

const STATUS_COLORS = {
  done: { bg: '#1a3a1a', color: '#4ADE80', label: 'DONE' },
  planned: { bg: '#1a1a3a', color: '#60A5FA', label: 'PLANNED' },
  researching: { bg: '#3a2a1a', color: '#FBBF24', label: 'RESEARCH' },
  'in-progress': { bg: '#3a1a1a', color: '#FF6B35', label: 'IN PROGRESS' },
}

// ── Desktop View ──
function DesktopCarMods() {
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
          <span className="ml-auto text-xs" style={{ color: '#555' }}>{PROJECT.miles} · {doneAll}/{totalAll} mods</span>
        </div>
      </div>

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
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="px-3 py-1.5 shrink-0" style={{ background: '#12121a', borderTop: '1px solid #2a2a3a' }}>
        <div className="text-xs" style={{ color: '#555' }}>{PROJECT.notes}</div>
      </div>
    </div>
  )
}

// ── Mobile View ──
function MobileCarMods() {
  const [activePhase, setActivePhase] = useState(null)
  const phase = PHASES.find(p => p.id === activePhase)

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
              <div style={{ fontSize: 11, marginTop: 4, color: mod.status === 'done' ? '#34C759' : mod.status === 'researching' ? '#FF9500' : '#007AFF' }}>
                {mod.status === 'done' ? '✓ Done' : mod.status === 'researching' ? '🔍 Researching' : '○ Planned'}
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
      </div>
    </div>
  )
}

export default function CarMods() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  return isMobile ? <MobileCarMods /> : <DesktopCarMods />
}

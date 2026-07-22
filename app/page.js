'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import {
  Search, LayoutDashboard, Users, ListTodo, Sparkles, Calendar, AlertTriangle,
  Activity, ChevronRight, Mail, Ticket, StickyNote, ArrowUpRight, ArrowDownRight,
  Loader2, Send, FileText, CheckCircle2, Clock, Building2, Command,
  Zap, ArrowRight, Trash2, TrendingUp, Target, Flame, Wand2, X, BookOpen, AlarmClock, Copy
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

const api = (p, opts) => fetch(`/api${p}`, opts).then(r => r.json())
const fmtDate = (iso) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
const fmtDay = (iso) => new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
const daysUntil = (iso) => Math.round((new Date(iso) - Date.now()) / 86400000)

function HealthPill({ score, label, trend }) {
  const color = score >= 80 ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    : score >= 60 ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
  const trendNum = parseInt(trend)
  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md border text-xs font-medium ${color}`}>
      <span className="font-mono">{score}</span>
      <span>{label}</span>
      {trend && (
        <span className="flex items-center gap-0.5 opacity-80">
          {trendNum >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </span>
      )}
    </div>
  )
}

function Logo({ text, size = 'md' }) {
  const sz = size === 'lg' ? 'w-12 h-12 text-lg' : 'w-9 h-9 text-sm'
  return <div className={`${sz} rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-semibold text-white shadow-sm`}>{text}</div>
}

function Sidebar({ view, setView }) {
  const items = [
    { id: 'workbench', label: 'Workbench', icon: Wand2 },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'accounts', label: 'Accounts', icon: Users },
    { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
    { id: 'tasks', label: 'Tasks', icon: ListTodo },
  ]
  return (
    <aside className="w-60 shrink-0 border-r border-white/5 bg-[#0c0c0e] flex flex-col">
      <div className="px-5 py-5 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold tracking-tight">Atlas</span>
        <Badge variant="outline" className="ml-auto text-[10px] border-white/10 text-zinc-400">BETA</Badge>
      </div>
      <nav className="px-2 py-2 space-y-0.5">
        {items.map(i => (
          <button key={i.id} onClick={() => setView({ name: i.id })}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition ${view.name === i.id ? 'bg-white/5 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'}`}>
            <i.icon className="w-4 h-4" />
            {i.label}
          </button>
        ))}
      </nav>
      <div className="mt-auto p-4 text-xs text-zinc-500">
        <div className="px-2 py-2 rounded-md bg-white/5 border border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-orange-400" />
            <div className="flex-1">
              <div className="text-zinc-200 text-xs font-medium">Alex Park</div>
              <div className="text-[10px] text-zinc-500">Senior CSM</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

function TopBar({ onSearch }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState(null)
  useEffect(() => {
    if (!q) { setResults(null); return }
    const t = setTimeout(async () => setResults(await api(`/search?q=${encodeURIComponent(q)}`)), 200)
    return () => clearTimeout(t)
  }, [q])
  return (
    <div className="h-14 border-b border-white/5 px-6 flex items-center gap-3 bg-[#0a0a0b]/80 backdrop-blur sticky top-0 z-30">
      <div className="relative flex-1 max-w-xl">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search accounts, contacts, tickets..."
          className="pl-9 pr-16 bg-white/[0.03] border-white/10 text-sm h-9 focus-visible:ring-1 focus-visible:ring-indigo-500/50" />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 text-[10px] text-zinc-500">
          <Command className="w-3 h-3" />K
        </div>
        {results && (results.companies?.length || results.contacts?.length) ? (
          <div className="absolute top-11 left-0 right-0 bg-[#111114] border border-white/10 rounded-lg shadow-2xl overflow-hidden">
            {results.companies?.map(c => (
              <button key={c.id} onClick={()=>{ onSearch(c); setQ(''); setResults(null) }} className="w-full px-3 py-2 flex items-center gap-3 hover:bg-white/5 text-left">
                <Logo text={c.logo} />
                <div className="flex-1">
                  <div className="text-sm text-white">{c.name}</div>
                  <div className="text-xs text-zinc-500">{c.industry}</div>
                </div>
                <HealthPill score={c.health} label={c.health_label} />
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Badge variant="outline" className="border-white/10 text-zinc-400">5 accounts</Badge>
      </div>
    </div>
  )
}

function DashboardView({ openAccount, openBrief }) {
  const [data, setData] = useState(null)
  const [ai, setAi] = useState(null)
  const [aiLoading, setAiLoading] = useState(true)
  const [range, setRange] = useState('12m')

  useEffect(() => {
    api('/dashboard/v2').then(setData)
    api('/dashboard/ai-summary', { method: 'POST', headers: {'Content-Type':'application/json'}, body: '{}' })
      .then(setAi).finally(() => setAiLoading(false))
  }, [])

  if (!data) return <div className="p-12 text-zinc-500"><Loader2 className="w-5 h-5 animate-spin" /></div>

  const now = new Date()
  const hr = now.getHours()
  const greet = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening'
  const dateLong = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="max-w-[1400px] mx-auto px-10 py-10 space-y-10">
      {/* HERO */}
      <header>
        <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">{dateLong}</div>
        <h1 className="text-[32px] font-semibold tracking-tight mt-1 leading-tight">{greet}, {data.greeting?.user || 'Subash'}.</h1>
        <p className="text-zinc-400 text-[15px] mt-1.5">Here&apos;s how your business is performing today.</p>
      </header>

      {/* KPI GRID */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {data.kpis.map(k => <KpiCard key={k.id} kpi={k} />)}
        </div>
      </section>

      {/* EXECUTIVE SUMMARY */}
      <section>
        <Card className="bg-gradient-to-br from-[#0f0f12] via-[#0e0e10] to-[#0a0a0b] border-white/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Atlas Morning Briefing</div>
              <div className="text-sm text-zinc-300">Generated for {data.greeting?.user || 'Subash'} · {ai?.last_updated ? new Date(ai.last_updated).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}) : '…'}</div>
            </div>
            {ai && <ConfidencePill score={ai.confidence} reasoning={ai.reasoning} evidence={ai.sources_used} />}
          </div>
          {aiLoading && !ai && (
            <div className="space-y-2"><div className="h-3 bg-white/5 rounded animate-pulse w-11/12" /><div className="h-3 bg-white/5 rounded animate-pulse w-10/12" /><div className="h-3 bg-white/5 rounded animate-pulse w-9/12" /></div>
          )}
          {ai && <p className="text-[17px] text-zinc-100 leading-[1.7] tracking-[-0.01em] max-w-4xl">{ai.executive_summary}</p>}
          <div className="mt-5 flex flex-wrap gap-2">
            {(ai?.sources_used || data.sources_used).map(s => <SourceChip key={s} app={s} name="live" timestamp="now" />)}
          </div>
        </Card>
      </section>

      {/* REVENUE PERFORMANCE */}
      <section>
        <SectionHeader title="Revenue performance" subtitle="Trailing 12-month view of ARR, expansion, churn and renewal revenue.">
          <RangeTabs value={range} onChange={setRange} />
        </SectionHeader>
        <Card className="bg-[#0f0f12] border-white/5 p-6">
          <RevenueChart data={data.revenue_chart} range={range} />
        </Card>
      </section>

      {/* GOAL TRACKER */}
      <section>
        <SectionHeader title="Goal tracker" subtitle="Quarterly targets — Atlas explains pacing." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.goals.map(g => <GoalCard key={g.id} goal={g} />)}
        </div>
      </section>

      {/* PORTFOLIO HEALTH */}
      <section>
        <SectionHeader title="Portfolio health" subtitle="Click any category to drill into accounts." />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {data.heatmap.map(b => <HealthBucket key={b.key} bucket={b} onOpen={openAccount} />)}
        </div>
      </section>

      {/* AI INSIGHTS */}
      <section>
        <SectionHeader title="Atlas insights" subtitle="Continuous portfolio analysis. No interaction required.">
          {ai && <ConfidencePill score={ai.confidence} reasoning={ai.reasoning} evidence={ai.sources_used} />}
        </SectionHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {aiLoading && !ai && [0,1,2,3,4,5].map(i => <InsightSkeleton key={i} />)}
          {ai?.insights?.map((ins, i) => <InsightCard key={i} ins={ins} />)}
        </div>
      </section>

      {/* FORECAST */}
      {ai?.forecast && (
        <section>
          <SectionHeader title="Forecast" subtitle="Atlas projections for the next 90 days." />
          <ForecastSection forecast={ai.forecast} />
        </section>
      )}

      {/* EXECUTIVE ATTENTION */}
      <section>
        <SectionHeader title="Executive attention" subtitle="Business-critical events requiring leadership focus. (Operational work lives in Workbench.)" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.attention.map((a, i) => <AttentionCard key={i} item={a} onOpen={() => openAccount(a.company)} />)}
        </div>
      </section>

      {/* SEGMENTATION */}
      <section>
        <SectionHeader title="Customer segmentation" subtitle="Distribution across the portfolio." />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SegmentCard title="By industry" data={data.segments.industry} />
          <SegmentCard title="By plan tier" data={data.segments.plan} />
          <SegmentCard title="By region" data={data.segments.region} />
          <SegmentCard title="By renewal month" data={data.segments.renewal} />
        </div>
      </section>

      {/* EXECUTIVE METRICS */}
      <section>
        <SectionHeader title="Executive metrics" subtitle="Composite portfolio averages." />
        <Card className="bg-[#0f0f12] border-white/5 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6">
            {data.exec_metrics.map((m, i) => <MetricCell key={i} m={m} />)}
          </div>
        </Card>
      </section>

      {/* PORTFOLIO TIMELINE */}
      <section>
        <SectionHeader title="Portfolio timeline" subtitle="Strategic changes only. Operational activity is in each account&apos;s Timeline tab." />
        <Card className="bg-[#0f0f12] border-white/5 p-2">
          <div className="divide-y divide-white/5">
            {data.portfolio_timeline.map((e, i) => <TimelineRow key={i} ev={e} />)}
          </div>
        </Card>
      </section>

      {/* RECOMMENDATIONS */}
      {ai?.recommendations?.length > 0 && (
        <section>
          <SectionHeader title="If I were managing your portfolio…" subtitle="Atlas&apos;s top moves, ranked by revenue impact." />
          <Card className="bg-[#0f0f12] border-white/5 p-2">
            <div className="divide-y divide-white/5">
              {ai.recommendations.sort((a,b) => (b.revenue_impact||0) - (a.revenue_impact||0)).map((r, i) => <RecommendationRow key={i} rank={i+1} rec={r} onOpen={openAccount} />)}
            </div>
          </Card>
        </section>
      )}

      {/* SOURCES FOOTER */}
      <section className="pt-2 pb-8">
        <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600 mb-2">Powered by</div>
        <div className="flex flex-wrap gap-2">
          {data.sources_used.map(s => <SourceChip key={s} app={s} name="live" timestamp="now" />)}
        </div>
      </section>
    </div>
  )
}

// ----- Dashboard sub-components -----

function SectionHeader({ title, subtitle, children }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
        {subtitle && <p className="text-xs text-zinc-500 mt-0.5 max-w-2xl">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function RangeTabs({ value, onChange }) {
  const tabs = [['30d','30d'],['90d','90d'],['6m','6m'],['12m','12m']]
  return (
    <div className="inline-flex p-0.5 bg-white/5 rounded-md border border-white/5">
      {tabs.map(([k, l]) => (
        <button key={k} onClick={() => onChange(k)}
          className={`px-2.5 py-1 text-[11px] rounded ${value === k ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-200'}`}>{l}</button>
      ))}
    </div>
  )
}

function fmtKpiValue(v, fmt) {
  if (v == null) return '—'
  if (fmt === 'money') return fmtMoney(v)
  if (fmt === 'pct') return `${v}%`
  if (fmt === 'score') return v.toString()
  if (fmt === 'text') return v
  return v.toString()
}

function KpiCard({ kpi }) {
  const [hover, setHover] = useState(false)
  const trendN = kpi.trend
  const trendUp = trendN != null && trendN >= 0
  const trendCls = trendN == null ? 'text-zinc-500' : trendUp ? 'text-emerald-400' : 'text-rose-400'
  const accent = kpi.id === 'outlook' ? (kpi.value === 'On Track' ? 'text-emerald-300' : kpi.value === 'Watch' ? 'text-amber-300' : 'text-rose-300') : 'text-white'
  return (
    <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      className="relative p-4 rounded-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/5 hover:border-white/10 transition group">
      <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">{kpi.label}</div>
      <div className={`text-2xl font-semibold mt-1 tracking-tight ${accent}`}>{fmtKpiValue(kpi.value, kpi.fmt)}</div>
      <div className="flex items-center gap-1 mt-1 text-[11px]">
        {trendN != null ? (
          <>
            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span className={`${trendCls} font-mono`}>{trendUp ? '+' : ''}{trendN}%</span>
            <span className="text-zinc-500">vs last month</span>
          </>
        ) : <span className="text-zinc-500">—</span>}
      </div>
      {hover && kpi.hint && (
        <div className="absolute z-30 -top-2 left-0 right-0 -translate-y-full p-3 rounded-lg bg-[#111114] border border-white/10 shadow-2xl text-xs text-zinc-200 leading-relaxed">
          {kpi.hint}
        </div>
      )}
    </div>
  )
}

function RevenueChart({ data, range }) {
  // Filter by range
  const n = range === '30d' ? 1 : range === '90d' ? 3 : range === '6m' ? 6 : 12
  const slice = data.slice(-n)
  const max = Math.max(...slice.map(d => d.arr))
  const min = Math.min(...slice.map(d => d.arr))
  const w = 1000, h = 220, pad = 32
  const x = (i) => pad + (i / Math.max(1, slice.length-1)) * (w - pad*2)
  const y = (v) => h - pad - ((v - min) / (max - min || 1)) * (h - pad*2)
  const linePts = slice.map((d, i) => `${x(i)},${y(d.arr)}`).join(' ')
  const areaPts = `M${pad},${h-pad} L${linePts.split(' ').join(' L')} L${w-pad},${h-pad} Z`
  const maxBar = Math.max(...slice.map(d => Math.max(d.expansion, d.churn, d.contraction)))
  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-5 mb-4 text-xs">
        <Legend color="#818cf8" label="ARR" />
        <Legend color="#10b981" label="Expansion" />
        <Legend color="#f43f5e" label="Churn" />
        <Legend color="#f59e0b" label="Contraction" />
        <div className="ml-auto text-zinc-500">Showing last {n} {n===1?'month':'months'}</div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-56" preserveAspectRatio="none">
        <defs>
          <linearGradient id="arrFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0,1,2,3].map(i => (
          <line key={i} x1={pad} x2={w-pad} y1={pad + i*(h-pad*2)/3} y2={pad + i*(h-pad*2)/3} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        ))}
        {/* Area */}
        <path d={areaPts} fill="url(#arrFill)" />
        {/* Line */}
        <polyline points={linePts} fill="none" stroke="#818cf8" strokeWidth="2" />
        {/* Bars at bottom for expansion/churn */}
        {slice.map((d, i) => {
          const cx = x(i)
          const barH = (d.expansion / maxBar) * 28
          const chH = (d.churn / maxBar) * 28
          return (
            <g key={i}>
              <rect x={cx-6} y={h-pad-barH} width="3" height={barH} fill="#10b981" opacity="0.85" />
              <rect x={cx-2} y={h-pad-chH} width="3" height={chH} fill="#f43f5e" opacity="0.85" />
              <circle cx={cx} cy={y(d.arr)} r="3" fill="#818cf8" stroke="#0f0f12" strokeWidth="1.5" />
            </g>
          )
        })}
        {/* X labels */}
        {slice.map((d, i) => (
          <text key={i} x={x(i)} y={h-8} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.4)" fontFamily="ui-monospace,monospace">{d.month}</text>
        ))}
      </svg>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <SummaryStat label="Ending ARR" value={fmtMoney(slice[slice.length-1].arr)} tone="indigo" />
        <SummaryStat label="Total expansion" value={fmtMoney(slice.reduce((a,b)=>a+b.expansion,0))} tone="emerald" />
        <SummaryStat label="Total churn" value={fmtMoney(slice.reduce((a,b)=>a+b.churn,0))} tone="rose" />
        <SummaryStat label="Net change" value={fmtMoney(slice[slice.length-1].arr - slice[0].arr)} tone="indigo" />
      </div>
    </div>
  )
}
function Legend({ color, label }) {
  return <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: color }} /><span className="text-zinc-300">{label}</span></div>
}
function SummaryStat({ label, value, tone }) {
  const t = { indigo:'text-indigo-300', emerald:'text-emerald-300', rose:'text-rose-300' }[tone] || 'text-white'
  return <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5"><div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div><div className={`text-base font-semibold mt-0.5 ${t}`}>{value}</div></div>
}

function GoalCard({ goal }) {
  const pct = goal.target ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0
  const ahead = goal.pacing >= 0
  const fmt = (v) => goal.fmt === 'money' ? fmtMoney(v) : goal.fmt === 'score' ? v : `${v}%`
  return (
    <Card className="bg-[#0f0f12] border-white/5 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">{goal.label}</div>
        <Badge className={`${ahead ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border-rose-500/30'} border text-[10px]`}>{ahead ? 'Ahead' : 'Behind'} {goal.pacing > 0 ? '+' : ''}{goal.pacing}%</Badge>
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-semibold text-white">{fmt(goal.current)}</div>
        <div className="text-xs text-zinc-500">of {fmt(goal.target)}</div>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className={`h-full ${ahead ? 'bg-emerald-400' : 'bg-amber-400'}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs text-zinc-400 leading-relaxed flex gap-1.5">
        <Sparkles className="w-3 h-3 text-indigo-400 mt-0.5 shrink-0" />
        <span>{goal.explainer}</span>
      </div>
    </Card>
  )
}

function HealthBucket({ bucket, onOpen }) {
  const meta = {
    healthy: { label: 'Healthy', icon: '🟢', tone: 'from-emerald-500/15 to-emerald-500/5 border-emerald-500/30 text-emerald-300' },
    needs_attention: { label: 'Needs attention', icon: '🟡', tone: 'from-amber-500/15 to-amber-500/5 border-amber-500/30 text-amber-300' },
    high_risk: { label: 'High risk', icon: '🔴', tone: 'from-rose-500/15 to-rose-500/5 border-rose-500/30 text-rose-300' },
    expansion_ready: { label: 'Expansion ready', icon: '📈', tone: 'from-violet-500/15 to-violet-500/5 border-violet-500/30 text-violet-300' },
    exec_escalation: { label: 'Executive escalation', icon: '🚨', tone: 'from-rose-500/15 to-rose-500/5 border-rose-500/30 text-rose-300' },
    upcoming_renewals: { label: 'Upcoming renewals', icon: '🔄', tone: 'from-indigo-500/15 to-indigo-500/5 border-indigo-500/30 text-indigo-300' },
  }[bucket.key] || { label: bucket.key, icon: '·', tone: 'from-white/5 to-white/0 border-white/10' }
  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br ${meta.tone} border`}>
      <div className="flex items-center gap-2 mb-2">
        <span>{meta.icon}</span>
        <div className="text-xs uppercase tracking-wider font-medium">{meta.label}</div>
        <div className="ml-auto text-xl font-semibold text-white">{bucket.count}</div>
      </div>
      <div className="text-xs text-zinc-500">{fmtMoney(bucket.arr)} ARR</div>
      <div className="mt-3 flex flex-wrap gap-1">
        {bucket.companies.slice(0,5).map(c => (
          <button key={c.id} onClick={() => onOpen({ id: c.id, name: c.name, logo: c.logo })}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[11px] text-zinc-200 transition">
            <span className="w-4 h-4 rounded bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[8px] font-semibold">{c.logo}</span>{c.name}
          </button>
        ))}
      </div>
    </div>
  )
}

function InsightCard({ ins }) {
  const tone = ins.sentiment === 'positive' ? 'emerald' : ins.sentiment === 'negative' ? 'rose' : 'zinc'
  const toneCls = { emerald:'text-emerald-300', rose:'text-rose-300', zinc:'text-zinc-300' }[tone]
  const dotCls = { emerald:'bg-emerald-400', rose:'bg-rose-400', zinc:'bg-zinc-400' }[tone]
  return (
    <Card className="bg-[#0f0f12] border-white/5 p-5 space-y-3">
      <div className="flex items-start gap-2">
        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${dotCls}`} />
        <div className="flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-medium text-white">{ins.title}</h3>
            <div className={`text-xs font-mono ${toneCls}`}>{ins.delta}</div>
          </div>
          <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">{ins.detail}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {(ins.sources || []).map((s, i) => <SourceChip key={i} app={s} name="live" timestamp="now" />)}
      </div>
    </Card>
  )
}
function InsightSkeleton() {
  return <div className="p-5 rounded-xl bg-[#0f0f12] border border-white/5 space-y-2"><div className="h-3 bg-white/5 rounded animate-pulse w-1/3" /><div className="h-2 bg-white/5 rounded animate-pulse w-full" /><div className="h-2 bg-white/5 rounded animate-pulse w-2/3" /></div>
}

function ForecastSection({ forecast }) {
  return (
    <div className="grid grid-cols-12 gap-4">
      <Card className="col-span-12 lg:col-span-8 bg-[#0f0f12] border-white/5 p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ForecastMetric label="Quarter-end ARR" value={fmtMoney(forecast.quarter_end_arr)} tone="indigo" />
          <ForecastMetric label="Expected expansion" value={fmtMoney(forecast.expected_expansion)} tone="emerald" />
          <ForecastMetric label="Expected churn" value={fmtMoney(forecast.expected_churn)} tone="rose" />
          <ForecastMetric label="Expected renewals" value={`${forecast.expected_renewals_count}`} sub="closures" tone="violet" />
        </div>
        <Separator className="my-5 bg-white/5" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500 mb-2 flex items-center gap-1.5"><AlertTriangle className="w-3 h-3 text-rose-400" />Biggest revenue risks</div>
            <ul className="space-y-2">
              {(forecast.biggest_risks || []).map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-rose-300 font-mono shrink-0">{fmtMoney(r.impact)}</span>
                  <span className="text-zinc-300"><span className="text-white font-medium">{r.company}</span> — {r.risk}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500 mb-2 flex items-center gap-1.5"><TrendingUp className="w-3 h-3 text-emerald-400" />Biggest growth opportunities</div>
            <ul className="space-y-2">
              {(forecast.biggest_opportunities || []).map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-emerald-300 font-mono shrink-0">+{fmtMoney(r.impact)}</span>
                  <span className="text-zinc-300"><span className="text-white font-medium">{r.company}</span> — {r.opportunity}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
      <Card className="col-span-12 lg:col-span-4 bg-gradient-to-br from-indigo-500/10 to-violet-500/5 border-indigo-500/20 p-5">
        <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-400 mb-2">Forecast confidence</div>
        <div className="text-4xl font-semibold text-white tracking-tight">{forecast.confidence}%</div>
        <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-400 to-violet-400" style={{ width: `${forecast.confidence}%` }} />
        </div>
        <div className="text-xs text-zinc-400 mt-4 leading-relaxed">Based on 12-month historical retention patterns, current pipeline maturity, and observed engagement signals across 7 data sources.</div>
      </Card>
    </div>
  )
}
function ForecastMetric({ label, value, sub, tone }) {
  const t = { indigo:'text-indigo-300', emerald:'text-emerald-300', rose:'text-rose-300', violet:'text-violet-300' }[tone] || 'text-white'
  return <div><div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">{label}</div><div className={`text-xl font-semibold mt-1 ${t}`}>{value}</div>{sub && <div className="text-[11px] text-zinc-500 mt-0.5">{sub}</div>}</div>
}

function AttentionCard({ item, onOpen }) {
  const toneBorder = { rose:'border-rose-500/30 from-rose-500/10', amber:'border-amber-500/30 from-amber-500/10', emerald:'border-emerald-500/30 from-emerald-500/10' }[item.tone] || 'border-white/10 from-white/5'
  const toneText = { rose:'text-rose-300', amber:'text-amber-300', emerald:'text-emerald-300' }[item.tone] || 'text-zinc-300'
  return (
    <button onClick={onOpen} className={`group p-5 rounded-xl bg-gradient-to-br ${toneBorder} to-transparent border text-left hover:scale-[1.01] transition`}>
      <div className="flex items-center gap-2.5 mb-3">
        <span className="text-lg">{item.icon}</span>
        <Logo text={item.company.logo} />
        <div className="flex-1">
          <div className="text-sm font-medium text-white">{item.company.name}</div>
          <div className={`text-xs ${toneText}`}>{item.headline}</div>
        </div>
      </div>
      <div className="text-sm text-zinc-300 leading-relaxed">{item.subline}</div>
      <div className="text-xs text-zinc-500 mt-1.5">{item.meta}</div>
      <Separator className="my-3 bg-white/5" />
      <div className="flex items-center gap-1.5 text-xs text-zinc-300">
        <span className={toneText}>→</span>{item.action}
      </div>
    </button>
  )
}

function SegmentCard({ title, data }) {
  const max = Math.max(...data.map(d => d.arr))
  return (
    <Card className="bg-[#0f0f12] border-white/5 p-5 space-y-3">
      <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">{title}</div>
      <div className="space-y-2">
        {data.map(d => (
          <div key={d.key} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-300">{d.key}</span>
              <span className="text-zinc-500 font-mono">{d.count} · {fmtMoney(d.arr)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${(d.arr/max)*100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function MetricCell({ m }) {
  const trendN = m.trend
  const trendUp = trendN != null && trendN >= 0
  const fmt = (v) => m.fmt === 'pct' ? `${v}%` : m.fmt === 'rating' ? v.toFixed(1) : m.fmt === 'hours' ? `${v}h` : m.fmt === 'days' ? `${v}d` : v
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">{m.label}</div>
      <div className="text-xl font-semibold mt-1 text-white">{fmt(m.value)}</div>
      {trendN != null && (
        <div className={`text-[11px] mt-0.5 font-mono ${trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>{trendUp ? '+' : ''}{trendN}{m.fmt === 'pct' || m.fmt === 'score' ? '' : ''}</div>
      )}
    </div>
  )
}

function TimelineRow({ ev }) {
  const tone = { emerald:'text-emerald-300', rose:'text-rose-300', amber:'text-amber-300', indigo:'text-indigo-300' }[ev.tone] || 'text-zinc-300'
  return (
    <div className="flex gap-4 px-4 py-3">
      <div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center shrink-0">{ev.icon}</div>
      <div className="flex-1">
        <div className={`text-sm font-medium ${tone}`}>{ev.title}</div>
        <div className="text-xs text-zinc-400 mt-0.5">{ev.detail}</div>
      </div>
      <div className="text-xs text-zinc-500 font-mono">{new Date(ev.when).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
    </div>
  )
}

function RecommendationRow({ rank, rec, onOpen }) {
  const kindMeta = {
    protect: { icon: '🛡', label: 'Protect', tone: 'text-rose-300' },
    expand: { icon: '📈', label: 'Expand', tone: 'text-emerald-300' },
    escalate: { icon: '🚨', label: 'Escalate', tone: 'text-amber-300' },
  }[rec.kind] || { icon: '·', label: '', tone: 'text-zinc-300' }
  return (
    <button onClick={() => onOpen({ name: rec.company, id: rec.company_id })} className="w-full flex items-center gap-5 px-5 py-4 hover:bg-white/[0.02] text-left transition">
      <div className="text-3xl font-semibold text-zinc-700 tabular-nums w-8">{rank.toString().padStart(2,'0')}</div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className="text-base font-medium text-white">{rec.title}</div>
          <Badge className={`bg-white/5 ${kindMeta.tone} border-white/10 border text-[10px]`}>{kindMeta.icon} {kindMeta.label}</Badge>
        </div>
        <div className="text-sm text-zinc-400 mt-0.5">{rec.company} · {rec.action}</div>
      </div>
      <div className="text-right">
        <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Revenue impact</div>
        <div className={`text-lg font-semibold font-mono ${rec.kind === 'expand' ? 'text-emerald-300' : 'text-rose-300'}`}>{rec.kind === 'expand' ? '+' : ''}{fmtMoney(rec.revenue_impact)}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-zinc-600" />
    </button>
  )
}

function AccountsView({ openAccount }) {
  const [companies, setCompanies] = useState([])
  useEffect(() => { api('/companies').then(setCompanies) }, [])
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Accounts</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map(c => (
          <button key={c.id} onClick={()=>openAccount(c)} className="text-left p-5 rounded-xl bg-[#0f0f12] border border-white/5 hover:border-white/10 hover:bg-white/[0.02] transition">
            <div className="flex items-start justify-between mb-4">
              <Logo text={c.logo} size="lg" />
              <HealthPill score={c.health} label={c.health_label} trend={c.health_trend} />
            </div>
            <div className="text-lg font-medium text-white">{c.name}</div>
            <div className="text-xs text-zinc-500 mt-0.5">{c.industry} • {c.region}</div>
            <Separator className="my-4 bg-white/5" />
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-zinc-500">ARR</div>
                <div className="text-zinc-200 font-medium mt-0.5">${(c.arr/1000).toFixed(0)}k</div>
              </div>
              <div>
                <div className="text-zinc-500">Renewal</div>
                <div className="text-zinc-200 font-medium mt-0.5">{daysUntil(c.renewal_date)} days</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function AccountDetailView({ companyId, openBrief, goBack }) {
  const [data, setData] = useState(null)
  const [quoteOpen, setQuoteOpen] = useState(false)
  useEffect(() => { api(`/companies/${companyId}`).then(setData) }, [companyId])
  if (!data) return <div className="p-8 text-zinc-500"><Loader2 className="w-5 h-5 animate-spin" /></div>
  const { company, contacts, tickets, timeline, meetings, invoices } = data
  const upcomingMeeting = meetings.find(m => new Date(m.scheduled_at) > new Date()) || meetings[0]

  const handleAction = (kind) => {
    if (kind === 'quote') setQuoteOpen(true)
    else openBrief(company, upcomingMeeting)
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-5">
      <button onClick={goBack} className="text-xs text-zinc-500 hover:text-zinc-300">← Back</button>

      <ExecutiveHeader company={company} onAction={handleAction} />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-[#0f0f12] border border-white/5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="adoption">Adoption</TabsTrigger>
          <TabsTrigger value="billing">Billing & Commercial</TabsTrigger>
          <TabsTrigger value="contacts">Contacts ({contacts.length})</TabsTrigger>
          <TabsTrigger value="tickets">Tickets ({tickets.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-12 gap-4">
            <Card className="col-span-12 lg:col-span-8 bg-[#0f0f12] border-white/5 p-5 space-y-4">
              <SectionTitle icon={Activity}>Recent activity</SectionTitle>
              <div className="space-y-2">
                {timeline.slice(0,8).map(t => (
                  <div key={t.id} className="flex gap-3 p-2 rounded-md hover:bg-white/[0.02]">
                    <div className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center shrink-0">
                      {t.type === 'email' && <Mail className="w-3.5 h-3.5 text-zinc-400" />}
                      {t.type === 'ticket' && <Ticket className="w-3.5 h-3.5 text-amber-400" />}
                      {t.type === 'note' && <StickyNote className="w-3.5 h-3.5 text-violet-400" />}
                      {t.type === 'meeting' && <Calendar className="w-3.5 h-3.5 text-indigo-400" />}
                      {t.type === 'invoice' && <FileText className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-zinc-100 truncate">{t.title}</div>
                      <div className="text-xs text-zinc-500 truncate">{t.detail}</div>
                    </div>
                    <div className="text-xs text-zinc-500 font-mono shrink-0">{fmtDate(t.at)}</div>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="col-span-12 lg:col-span-4 bg-[#0f0f12] border-white/5 p-5 space-y-3">
              <SectionTitle icon={BookOpen}>Sources Atlas reads</SectionTitle>
              <div className="flex flex-wrap gap-2">
                <SourceChip app="Salesforce" name={`${company.name} Account`} timestamp="live" />
                <SourceChip app="Stripe" name={`${invoices?.length||0} invoices`} timestamp="live" />
                <SourceChip app="Gmail" name="customer threads" timestamp="real-time" />
                <SourceChip app="Zendesk" name={`${tickets.length} tickets`} timestamp="real-time" />
                <SourceChip app="Slack" name="#csm channel" timestamp="real-time" />
                <SourceChip app="Product Usage" name={`${company.dau} DAU`} timestamp="hourly" />
                <SourceChip app="Meeting Notes" name={`${meetings.length} meetings`} timestamp="auto" />
              </div>
              <Separator className="bg-white/5" />
              <div className="text-xs text-zinc-500 leading-relaxed">Atlas synthesizes data from <span className="text-zinc-300">7 systems</span>. Every recommendation cites its sources.</div>
              <Separator className="bg-white/5" />
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">Strategic notes</div>
              <div className="text-xs text-zinc-300 leading-relaxed">{company.strategic_notes}</div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <Card className="bg-[#0f0f12] border-white/5 p-5">
            <div className="space-y-3">
              {timeline.map(t => (
                <div key={t.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center shrink-0">
                    {t.type === 'email' && <Mail className="w-4 h-4 text-zinc-400" />}
                    {t.type === 'ticket' && <Ticket className="w-4 h-4 text-amber-400" />}
                    {t.type === 'note' && <StickyNote className="w-4 h-4 text-violet-400" />}
                    {t.type === 'meeting' && <Calendar className="w-4 h-4 text-indigo-400" />}
                    {t.type === 'invoice' && <FileText className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-white">{t.title}</div>
                      <div className="text-xs text-zinc-500 ml-auto font-mono">{fmtDate(t.at)}</div>
                    </div>
                    <div className="text-xs text-zinc-400 mt-1">{t.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="adoption" className="mt-4">
          <AdoptionTab company={company} />
        </TabsContent>

        <TabsContent value="billing" className="mt-4">
          <BillingTab company={company} invoices={invoices} onBuildQuote={() => setQuoteOpen(true)} />
        </TabsContent>

        <TabsContent value="contacts" className="mt-4">
          <Card className="bg-[#0f0f12] border-white/5 p-5 space-y-2">
            {contacts.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-white/[0.03]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-xs font-medium">{c.name.split(' ').map(p=>p[0]).join('')}</div>
                <div className="flex-1">
                  <div className="text-sm text-white">{c.name}</div>
                  <div className="text-xs text-zinc-500">{c.title} • {c.email}</div>
                </div>
                <Badge variant="outline" className="border-white/10 text-zinc-300">{c.role}</Badge>
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="mt-4">
          <Card className="bg-[#0f0f12] border-white/5 p-5 space-y-2">
            {tickets.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-2 rounded-md">
                <Badge className={`${t.priority==='P1'?'bg-rose-500/20 text-rose-300':'bg-amber-500/20 text-amber-300'} border-0`}>{t.priority}</Badge>
                <div className="flex-1 text-sm text-white">{t.subject}</div>
                <div className="text-xs text-zinc-500">{t.status}</div>
              </div>
            ))}
          </Card>
        </TabsContent>
      </Tabs>

      <QuoteBuilder company={company} open={quoteOpen} onClose={() => setQuoteOpen(false)} />
    </div>
  )
}

function BriefModal({ open, onClose, company, meeting }) {
  const [loading, setLoading] = useState(false)
  const [brief, setBrief] = useState(null)
  const [followup, setFollowup] = useState(null)
  const [generating, setGenerating] = useState(null)
  const [approved, setApproved] = useState(false)
  const isQbrDefault = !!meeting && (meeting.type === 'QBR' || /qbr|quarterly/i.test(meeting.title || ''))
  const [mode, setMode] = useState('brief')

  useEffect(() => {
    if (open && company && !brief) {
      setLoading(true); setApproved(false); setFollowup(null)
      setMode(isQbrDefault ? 'qbr' : 'brief')
      api('/brief', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ companyId: company.id, meetingId: meeting?.id }) })
        .then(r => setBrief(r.brief))
        .finally(() => setLoading(false))
    }
    if (!open) { setBrief(null); setFollowup(null); setApproved(false) }
  }, [open, company?.id, meeting?.id])

  const genFollowup = async () => {
    setGenerating('followup')
    const r = await api('/followup', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ companyId: company.id, meetingId: meeting?.id }) })
    setFollowup(r)
    setGenerating(null)
  }
  const approve = async () => {
    await api('/followup/approve', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: followup.id }) })
    setApproved(true)
  }

  if (!company) return null
  const isQbr = mode === 'qbr'
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`${isQbr ? '!max-w-none w-[92vw] h-[90vh]' : 'max-w-4xl max-h-[90vh]'} bg-[#0c0c0e] border-white/10 text-zinc-100 overflow-hidden flex flex-col p-0`}>
        <DialogHeader className="p-6 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Logo text={company.logo} />
            <div className="min-w-0">
              <DialogTitle className="text-lg font-semibold truncate">{meeting?.title || `Meeting brief — ${company.name}`}</DialogTitle>
              <div className="text-xs text-zinc-500 mt-0.5 font-normal">{meeting ? `${fmtDate(meeting.scheduled_at)} • ${meeting.duration_min}m • ${meeting.attendees.join(', ')}` : 'AI-generated brief'}</div>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="inline-flex p-0.5 bg-white/5 rounded-md border border-white/5">
                <button onClick={() => setMode('brief')} className={`px-2.5 py-1 text-[11px] rounded ${mode==='brief' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-200'}`}>Brief</button>
                <button onClick={() => setMode('qbr')} className={`px-2.5 py-1 text-[11px] rounded ${mode==='qbr' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-200'}`}>QBR Deck</button>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Generated by Atlas AI</span>
              </div>
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="flex-1 p-6">
          {loading && (
            <div className="py-20 flex flex-col items-center gap-3 text-zinc-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              <div className="text-sm">Atlas is reading {company.name}&apos;s emails, tickets, notes, and renewal history...</div>
            </div>
          )}
          {brief && mode === 'qbr' && <QbrDeck brief={brief} company={company} meeting={meeting} />}
          {brief && mode === 'brief' && (
            <div className="space-y-6">
              <section>
                <SectionTitle icon={FileText}>Executive Summary</SectionTitle>
                <p className="text-sm text-zinc-200 leading-relaxed">{brief.executive_summary}</p>
              </section>
              <div className="grid grid-cols-2 gap-4">
                <InfoBlock label="Sentiment" value={brief.sentiment?.label} sub={brief.sentiment?.reasoning} />
                <InfoBlock label="Renewal" value={`${brief.renewal_status?.days_to_renewal}d • ${brief.renewal_status?.label}`} sub={brief.renewal_status?.summary} />
              </div>
              <BulletSection title="Recent Activity" items={brief.recent_activity} />
              <BulletSection title="Open Issues" items={brief.open_issues} tone="amber" />
              <BulletSection title="Risks" items={brief.risks} tone="rose" />
              <BulletSection title="Expansion Opportunities" items={brief.expansion_opportunities} tone="emerald" />
              <BulletSection title="Suggested Talking Points" items={brief.talking_points} numbered tone="indigo" />
              <section>
                <SectionTitle>Recommended Next Actions</SectionTitle>
                <div className="space-y-2">
                  {brief.next_actions?.map((a, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-md bg-white/[0.02] border border-white/5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm text-white">{a.action}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">{a.owner} • due {a.due}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <Separator className="bg-white/5 my-6" />
              {!followup && (
                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20">
                  <div>
                    <div className="text-sm font-medium text-white">After the meeting</div>
                    <div className="text-xs text-zinc-400 mt-0.5">Generate follow-up email, CRM note, and tasks — ready for your approval.</div>
                  </div>
                  <Button onClick={genFollowup} disabled={generating==='followup'} className="bg-indigo-500 hover:bg-indigo-400">
                    {generating==='followup' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Generate Follow-up
                  </Button>
                </div>
              )}
              {followup && (
                <div className="space-y-4">
                  <SectionTitle icon={Mail}>Follow-up Email</SectionTitle>
                  <div className="p-4 rounded-lg bg-[#0a0a0b] border border-white/5">
                    <div className="text-xs text-zinc-500">To: {followup.result.email.to?.join(', ')}</div>
                    <div className="text-sm font-medium text-white mt-1">{followup.result.email.subject}</div>
                    <Separator className="my-3 bg-white/5" />
                    <pre className="text-sm text-zinc-200 whitespace-pre-wrap font-sans leading-relaxed">{followup.result.email.body}</pre>
                  </div>
                  <SectionTitle icon={StickyNote}>CRM Note</SectionTitle>
                  <div className="p-4 rounded-lg bg-[#0a0a0b] border border-white/5 text-sm text-zinc-200 whitespace-pre-wrap">{followup.result.crm_note}</div>
                  <SectionTitle icon={ListTodo}>Tasks ({followup.result.tasks?.length})</SectionTitle>
                  <div className="space-y-2">
                    {followup.result.tasks?.map((t, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-md bg-white/[0.02] border border-white/5">
                        <Badge className={`${t.priority==='P1'?'bg-rose-500/20 text-rose-300':t.priority==='P2'?'bg-amber-500/20 text-amber-300':'bg-zinc-700/40 text-zinc-300'} border-0 shrink-0`}>{t.priority}</Badge>
                        <div className="flex-1">
                          <div className="text-sm text-white">{t.title}</div>
                          <div className="text-xs text-zinc-500">{t.owner} • due {t.due}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {!approved ? (
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <Button variant="outline" className="border-white/10" onClick={() => setFollowup(null)}>Regenerate</Button>
                      <Button onClick={approve} className="bg-emerald-500 hover:bg-emerald-400 text-black">
                        <CheckCircle2 className="w-4 h-4 mr-2" />Approve & Execute
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      Approved. Email sent, CRM note saved, tasks created.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

// ---------- PITCH-STYLE QBR DECK ----------
function QbrDeck({ brief, company, meeting }) {
  const period = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const renewalDays = company.renewal_date ? daysUntil(company.renewal_date) : null

  // Hash company name to a brand gradient
  let h = 0
  for (let i = 0; i < (company.name || '').length; i++) h = (h * 31 + company.name.charCodeAt(i)) >>> 0
  const hue1 = h % 360
  const hue2 = (h * 7) % 360
  const brand = `linear-gradient(135deg, hsl(${hue1} 70% 25%), hsl(${hue2} 70% 14%))`

  const slides = [
    {
      id: 'cover', kind: 'cover', title: company.name, kicker: `${period} Business Review`,
    },
    {
      id: 'summary', kind: 'text', label: '01 · Executive Summary', title: 'Where we stand',
      body: brief.executive_summary,
    },
    {
      id: 'stats', kind: 'stats', label: '02 · Health & Status', title: 'Account snapshot',
      stats: [
        { value: `${company.health}`, label: 'Health Score', tone: company.health >= 80 ? 'emerald' : company.health >= 60 ? 'amber' : 'rose' },
        { value: renewalDays != null ? `${renewalDays}d` : '—', label: 'To Renewal', tone: renewalDays && renewalDays < 30 ? 'amber' : 'indigo' },
        { value: brief.sentiment?.label || '—', label: 'Sentiment', tone: 'violet' },
        { value: company.arr ? `$${(company.arr/1000).toFixed(0)}k` : '—', label: 'ARR', tone: 'emerald' },
      ],
      footnote: brief.renewal_status?.summary || brief.sentiment?.reasoning,
    },
    {
      id: 'activity', kind: 'bullets', label: '03 · Recent Activity', title: "What's happened since we last met",
      bullets: brief.recent_activity || [],
    },
    {
      id: 'open', kind: 'bullets', label: '04 · Open Issues', title: 'What needs attention', tone: 'amber',
      bullets: brief.open_issues || [],
    },
    {
      id: 'risks', kind: 'bullets', label: '05 · Risks', title: 'What could go wrong', tone: 'rose',
      bullets: brief.risks || [],
    },
    {
      id: 'expansion', kind: 'bullets', label: '06 · Growth Opportunities', title: 'Where we can expand', tone: 'emerald',
      bullets: brief.expansion_opportunities || [],
    },
    {
      id: 'agenda', kind: 'numbered', label: '07 · Today\u2019s Agenda', title: 'How we\u2019ll use our time', tone: 'indigo',
      bullets: brief.talking_points || [],
    },
    {
      id: 'next', kind: 'actions', label: '08 · Next Steps', title: 'What happens after this meeting',
      actions: brief.next_actions || [],
    },
    { id: 'thanks', kind: 'thanks', title: 'Thank you.', kicker: 'Questions?' },
  ]

  const [idx, setIdx] = useState(0)
  const slide = slides[idx]
  const goto = (i) => setIdx(Math.max(0, Math.min(slides.length - 1, i)))

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); goto(idx + 1) }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); goto(idx - 1) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [idx])

  return (
    <div className="flex gap-4 h-full min-h-[520px]">
      {/* Slide nav */}
      <aside className="w-44 shrink-0 space-y-1.5 overflow-y-auto pr-1">
        {slides.map((s, i) => (
          <button key={s.id} onClick={() => goto(i)}
            className={`w-full text-left aspect-[16/10] rounded-md border transition relative overflow-hidden ${i === idx ? 'border-indigo-400/60 ring-2 ring-indigo-400/30' : 'border-white/5 hover:border-white/15'}`}
            style={i === 0 || s.kind === 'thanks' ? { background: brand } : { background: '#0f0f12' }}>
            <div className="absolute inset-0 p-2 flex flex-col justify-between">
              <div className="text-[8px] uppercase tracking-wider text-white/50 font-mono">{(i+1).toString().padStart(2,'0')}</div>
              <div className={`text-[9px] font-medium leading-tight ${i === 0 || s.kind === 'thanks' ? 'text-white/90' : 'text-zinc-300'} line-clamp-2`}>{s.title}</div>
            </div>
          </button>
        ))}
      </aside>

      {/* Stage */}
      <div className="flex-1 min-w-0 flex flex-col">
        <SlideStage slide={slide} company={company} brand={brand} period={period} />
        {/* Slide controls */}
        <div className="flex items-center gap-3 mt-3 px-2">
          <button onClick={() => goto(idx - 1)} disabled={idx === 0} className="px-2 py-1 rounded bg-white/5 disabled:opacity-30 text-xs text-zinc-300">← Prev</button>
          <div className="text-[11px] text-zinc-500 font-mono">{(idx + 1).toString().padStart(2,'0')} / {slides.length.toString().padStart(2,'0')}</div>
          <div className="flex-1 h-0.5 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${((idx+1)/slides.length)*100}%` }} />
          </div>
          <button onClick={() => goto(idx + 1)} disabled={idx === slides.length - 1} className="px-2 py-1 rounded bg-white/5 disabled:opacity-30 text-xs text-zinc-300">Next →</button>
          <span className="text-[10px] text-zinc-600 font-mono">← / → to navigate</span>
        </div>
      </div>
    </div>
  )
}

function SlideStage({ slide, company, brand, period }) {
  if (slide.kind === 'cover') {
    return (
      <div className="flex-1 rounded-2xl overflow-hidden relative" style={{ background: brand }}>
        <div className="absolute inset-0 flex flex-col justify-center px-16 py-12">
          <div className="text-xs uppercase tracking-[0.3em] text-white/60 mb-6">Quarterly Business Review</div>
          <div className="w-16 h-16 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center text-2xl font-bold text-white mb-6">{company.logo}</div>
          <h1 className="text-7xl font-semibold tracking-tight text-white leading-[0.95]">{company.name}</h1>
          <div className="text-2xl text-white/80 mt-3 font-light">{slide.kicker}</div>
          <div className="absolute bottom-12 left-16 right-16 flex items-end justify-between text-xs text-white/50">
            <div>Prepared by Alex Park · Atlas Customer Success</div>
            <div>Prepared for {company.exec_sponsor?.split(' — ')[0] || 'leadership team'}</div>
          </div>
        </div>
      </div>
    )
  }
  if (slide.kind === 'thanks') {
    return (
      <div className="flex-1 rounded-2xl overflow-hidden relative" style={{ background: brand }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <h1 className="text-7xl font-semibold tracking-tight text-white">{slide.title}</h1>
          <div className="text-2xl text-white/80 mt-4 font-light">{slide.kicker}</div>
        </div>
      </div>
    )
  }
  const toneCls = { amber:'text-amber-300', rose:'text-rose-300', emerald:'text-emerald-300', indigo:'text-indigo-300', violet:'text-violet-300' }[slide.tone] || 'text-zinc-300'
  const dotCls = { amber:'bg-amber-400', rose:'bg-rose-400', emerald:'bg-emerald-400', indigo:'bg-indigo-400', violet:'bg-violet-400' }[slide.tone] || 'bg-zinc-400'
  return (
    <div className="flex-1 rounded-2xl bg-[#0f0f12] border border-white/5 px-14 py-12 overflow-y-auto">
      {slide.label && <div className={`text-xs uppercase tracking-[0.3em] ${toneCls} mb-4 font-mono`}>{slide.label}</div>}
      <h2 className="text-4xl font-semibold tracking-tight text-white leading-tight">{slide.title}</h2>
      <Separator className="my-7 bg-white/5" />
      {slide.kind === 'text' && (
        <p className="text-[19px] text-zinc-200 leading-[1.7] tracking-[-0.01em] max-w-3xl font-serif">{slide.body}</p>
      )}
      {slide.kind === 'stats' && (
        <>
          <div className="grid grid-cols-4 gap-6 mt-2">
            {slide.stats.map((s, i) => {
              const t = { emerald:'text-emerald-300', amber:'text-amber-300', rose:'text-rose-300', indigo:'text-indigo-300', violet:'text-violet-300' }[s.tone] || 'text-white'
              return (
                <div key={i} className="space-y-2">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">{s.label}</div>
                  <div className={`text-6xl font-semibold tracking-tight ${t} leading-none`}>{s.value}</div>
                </div>
              )
            })}
          </div>
          {slide.footnote && <p className="text-sm text-zinc-400 mt-10 leading-relaxed max-w-3xl">{slide.footnote}</p>}
        </>
      )}
      {slide.kind === 'bullets' && (
        <ul className="space-y-5 max-w-3xl">
          {slide.bullets.map((b, i) => (
            <li key={i} className="flex gap-4">
              <span className={`mt-3 w-2 h-2 rounded-full shrink-0 ${dotCls}`} />
              <span className="text-[18px] text-zinc-100 leading-[1.55]">{b}</span>
            </li>
          ))}
        </ul>
      )}
      {slide.kind === 'numbered' && (
        <ol className="space-y-5 max-w-3xl">
          {slide.bullets.map((b, i) => (
            <li key={i} className="flex gap-5">
              <span className={`text-3xl font-semibold ${toneCls} font-mono tabular-nums w-10 shrink-0`}>{(i+1).toString().padStart(2,'0')}</span>
              <span className="text-[18px] text-zinc-100 leading-[1.55] pt-1.5">{b}</span>
            </li>
          ))}
        </ol>
      )}
      {slide.kind === 'actions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
          {slide.actions.map((a, i) => (
            <div key={i} className="p-5 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Action {(i+1).toString().padStart(2,'0')}</div>
              <div className="text-base font-medium text-white mt-1.5 leading-snug">{a.action}</div>
              <div className="text-xs text-zinc-400 mt-3 flex items-center gap-2"><Users className="w-3 h-3" />{a.owner} · due {a.due}</div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-12 flex items-center gap-3 text-[10px] text-zinc-600 font-mono">
        <div className="w-5 h-5 rounded bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[8px] font-semibold text-white">{company.logo}</div>
        {company.name} · {period} QBR · Prepared by Alex Park
      </div>
    </div>
  )
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {Icon && <Icon className="w-3.5 h-3.5 text-zinc-500" />}
      <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">{children}</div>
    </div>
  )
}
function InfoBlock({ label, value, sub }) {
  return (
    <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
      <div className="text-xs text-zinc-500 uppercase tracking-wider">{label}</div>
      <div className="text-base font-medium text-white mt-1">{value}</div>
      {sub && <div className="text-xs text-zinc-400 mt-1.5 leading-relaxed">{sub}</div>}
    </div>
  )
}
function BulletSection({ title, items, numbered, tone = 'zinc' }) {
  if (!items?.length) return null
  const dot = { zinc: 'bg-zinc-500', amber: 'bg-amber-400', rose: 'bg-rose-400', emerald: 'bg-emerald-400', indigo: 'bg-indigo-400' }[tone]
  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className="flex gap-3 text-sm text-zinc-200 leading-relaxed">
            {numbered ? (
              <span className="text-xs font-mono text-zinc-500 mt-0.5 w-5">{(i+1).toString().padStart(2,'0')}</span>
            ) : (
              <span className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
            )}
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

// ---------- WORKBENCH ----------
function WorkbenchView({ openAccount }) {
  const [overview, setOverview] = useState(null)
  const [cards, setCards] = useState([])
  const [loadingCards, setLoadingCards] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [executing, setExecuting] = useState(false)
  const [reviewCard, setReviewCard] = useState(null)
  const [error, setError] = useState(null)

  const loadCards = async () => {
    const c = await api('/workbench/cards')
    setCards(Array.isArray(c) ? c : [])
    setLoadingCards(false)
  }

  useEffect(() => {
    api('/workbench/overview').then(setOverview)
    loadCards()
  }, [])

  const generateProactive = async () => {
    setGenerating(true); setError(null)
    try {
      const c = await api('/workbench/proactive', { method: 'POST', headers: {'Content-Type':'application/json'}, body: '{}' })
      if (Array.isArray(c)) setCards(prev => [...c, ...prev.filter(p => p.source !== 'proactive' || p.status === 'approved')])
      api('/workbench/overview').then(setOverview)
    } catch (e) { setError(e.message) }
    setGenerating(false)
  }

  // Auto-generate proactive cards on first load if none exist
  useEffect(() => {
    if (!loadingCards && cards.filter(c => c.source === 'proactive' && c.status === 'ready').length === 0 && !generating) {
      generateProactive()
    }
  }, [loadingCards])

  const submitPrompt = async (e) => {
    e?.preventDefault()
    const p = prompt.trim()
    if (!p || executing) return
    setExecuting(true); setError(null)
    try {
      const c = await api('/workbench/execute', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ prompt: p }) })
      if (c.error) { setError(c.error); }
      else { setCards(prev => [c, ...prev]); setPrompt(''); setReviewCard(c) }
    } catch (err) { setError(err.message) }
    setExecuting(false)
  }

  const approveCard = async (card) => {
    await api(`/workbench/cards/${card.id}/approve`, { method: 'POST' })
    setCards(prev => prev.map(c => c.id === card.id ? { ...c, status: 'approved' } : c))
    setReviewCard(null)
  }
  const dismissCard = async (card) => {
    await api(`/workbench/cards/${card.id}/dismiss`, { method: 'POST' })
    setCards(prev => prev.filter(c => c.id !== card.id))
    setReviewCard(null)
  }

  const examples = [
    'Email Umbrella about churn',
    "Prepare tomorrow's QBR for Initech",
    'Summarize Hooli',
    'Create a success plan for Globex',
    'Schedule renewal call with Acme',
  ]

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening'
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const ready = cards.filter(c => c.status === 'ready')
  const approved = cards.filter(c => c.status === 'approved')

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Hero */}
      <div>
        <div className="text-xs text-zinc-500 uppercase tracking-wider">{dateStr}</div>
        <h1 className="text-3xl font-semibold mt-1.5 tracking-tight">{greeting}, Alex.</h1>
        <p className="text-zinc-400 mt-2 text-[15px]">Today Atlas has identified opportunities and risks across your portfolio.</p>

        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5">
            <StatPill icon={Flame} tone="rose" value={overview.highRisk} label="High-risk accounts" />
            <StatPill icon={TrendingUp} tone="emerald" value={overview.expansion} label="Expansion signals" />
            <StatPill icon={AlarmClock} tone="amber" value={overview.renewals} label="Renewals < 30d" />
            <StatPill icon={Calendar} tone="indigo" value={overview.meetings} label="Meetings today" />
            <StatPill icon={CheckCircle2} tone="violet" value={ready.length} label="Awaiting approval" />
          </div>
        )}
      </div>

      {/* Command bar */}
      <div>
        <form onSubmit={submitPrompt} className="relative">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-fuchsia-500/20 rounded-xl blur-xl opacity-50 group-focus-within:opacity-100 transition" />
            <div className="relative bg-[#0f0f12] border border-white/10 rounded-xl px-5 py-4 flex items-center gap-3 focus-within:border-indigo-500/50 transition">
              <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
              <input
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Ask Atlas to prepare anything..."
                disabled={executing}
                className="flex-1 bg-transparent outline-none text-base placeholder:text-zinc-600 text-white"
              />
              {prompt && !executing && (
                <button type="submit" className="px-3 py-1.5 rounded-md bg-indigo-500 hover:bg-indigo-400 text-white text-sm flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />Execute
                </button>
              )}
              {executing && (
                <div className="flex items-center gap-2 text-sm text-indigo-300">
                  <Loader2 className="w-4 h-4 animate-spin" />Atlas is preparing...
                </div>
              )}
            </div>
          </div>
        </form>
        <div className="flex flex-wrap gap-2 mt-3">
          {examples.map(ex => (
            <button key={ex} onClick={() => setPrompt(ex)} disabled={executing}
              className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 border border-white/5 transition">
              {ex}
            </button>
          ))}
        </div>
        {error && <div className="mt-3 text-sm text-rose-400">{error}</div>}
      </div>

      {/* Atlas-prepared cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-300">Atlas has prepared</h2>
            <Badge variant="secondary" className="bg-white/5 text-zinc-400 border-0">{ready.length}</Badge>
          </div>
          <button onClick={generateProactive} disabled={generating}
            className="text-xs text-zinc-500 hover:text-zinc-200 flex items-center gap-1.5">
            {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {generating ? 'Atlas is analyzing portfolio...' : 'Refresh'}
          </button>
        </div>

        {generating && ready.length === 0 && (
          <div className="space-y-3">
            {[0,1,2].map(i => <SkeletonCard key={i} />)}
            <div className="text-center text-xs text-zinc-500 mt-4">Atlas is reading emails, tickets, notes, renewals across 5 accounts...</div>
          </div>
        )}
        {!generating && ready.length === 0 && (
          <div className="text-center py-12 text-sm text-zinc-500">No prepared actions yet. Atlas will surface them after analysis.</div>
        )}

        <div className="space-y-3">
          {ready.map(card => (
            <TaskCard key={card.id} card={card} onReview={() => setReviewCard(card)} onApprove={() => approveCard(card)} onDismiss={() => dismissCard(card)} openAccount={openAccount} />
          ))}
        </div>

        {approved.length > 0 && (
          <div className="mt-8">
            <div className="text-xs uppercase tracking-wider text-zinc-500 mb-3">Executed today</div>
            <div className="space-y-2">
              {approved.slice(0,5).map(c => (
                <div key={c.id} className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <Logo text={c.company?.logo} size="sm" />
                  <div className="flex-1 text-sm text-zinc-200">{c.title}</div>
                  <div className="text-xs text-zinc-500">Executed</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <CardReviewModal card={reviewCard} onClose={() => setReviewCard(null)} onApprove={() => approveCard(reviewCard)} onDismiss={() => dismissCard(reviewCard)} />
    </div>
  )
}

function StatPill({ icon: Icon, tone, value, label }) {
  const tones = {
    rose: 'from-rose-500/10 to-rose-500/5 border-rose-500/20 text-rose-300',
    emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 text-emerald-300',
    amber: 'from-amber-500/10 to-amber-500/5 border-amber-500/20 text-amber-300',
    indigo: 'from-indigo-500/10 to-indigo-500/5 border-indigo-500/20 text-indigo-300',
    violet: 'from-violet-500/10 to-violet-500/5 border-violet-500/20 text-violet-300',
  }[tone] || 'from-zinc-500/10 to-zinc-500/5 border-zinc-500/20'
  return (
    <div className={`p-3 rounded-lg bg-gradient-to-br ${tones} border`}>
      <div className="flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" /><span className="text-xs">{label}</span></div>
      <div className="text-2xl font-semibold mt-1 text-white">{value}</div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="p-5 rounded-xl bg-[#0f0f12] border border-white/5 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-white/5" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-white/5 rounded w-1/3" />
          <div className="h-2 bg-white/5 rounded w-2/3" />
          <div className="h-2 bg-white/5 rounded w-1/2" />
        </div>
      </div>
    </div>
  )
}

function intentMeta(intent) {
  return {
    draft_email: { icon: Mail, label: 'Draft email', tone: 'indigo' },
    prepare_meeting: { icon: BookOpen, label: 'Meeting prep', tone: 'violet' },
    summarize: { icon: FileText, label: 'Summary', tone: 'zinc' },
    schedule_call: { icon: Calendar, label: 'Schedule call', tone: 'indigo' },
    success_plan: { icon: Target, label: 'Success plan', tone: 'emerald' },
    update_crm: { icon: StickyNote, label: 'CRM update', tone: 'zinc' },
    executive_escalation: { icon: Flame, label: 'Escalation', tone: 'rose' },
  }[intent] || { icon: Sparkles, label: 'Action', tone: 'zinc' }
}

function TaskCard({ card, onReview, onApprove, onDismiss, openAccount }) {
  const m = intentMeta(card.intent)
  const Icon = m.icon
  const prio = card.priority === 'P0' ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
    : card.priority === 'P1' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    : 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30'
  return (
    <div className="group p-5 rounded-xl bg-[#0f0f12] border border-white/5 hover:border-white/10 transition">
      <div className="flex items-start gap-4">
        <Logo text={card.company?.logo} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => openAccount(card.company)} className="text-base font-medium text-white hover:underline">{card.title}</button>
            <Badge className={`${prio} border text-[10px] font-medium`}>{card.priority}</Badge>
            <Badge variant="outline" className="border-white/10 text-zinc-400 text-[10px]">
              <Icon className="w-3 h-3 mr-1" />{m.label}
            </Badge>
            <Badge variant="outline" className="border-white/10 text-zinc-500 text-[10px]">
              <Clock className="w-3 h-3 mr-1" />~{card.estimated_seconds}s to review
            </Badge>
            {card.source === 'user_prompt' && (
              <Badge variant="outline" className="border-indigo-500/30 text-indigo-300 text-[10px]">Your request</Badge>
            )}
          </div>
          <div className="text-sm text-zinc-300 mt-2 leading-relaxed"><span className="text-zinc-500">Why now: </span>{card.reason}</div>
          <div className="text-sm text-zinc-300 mt-1.5 leading-relaxed"><span className="text-zinc-500">Impact: </span>{card.business_impact}</div>
          <div className="text-sm text-zinc-200 mt-1.5 leading-relaxed"><span className="text-zinc-500">Recommended: </span>{card.recommended_action}</div>
          {card.prompt && <div className="mt-2 text-xs text-zinc-500 italic">From your prompt: "{card.prompt}"</div>}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Button size="sm" onClick={onReview} variant="outline" className="border-white/10 hover:bg-white/5">
          Review
        </Button>
        <Button size="sm" onClick={onApprove} className="bg-emerald-500 hover:bg-emerald-400 text-black">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />Approve & Execute
        </Button>
        <Button size="sm" onClick={onDismiss} variant="ghost" className="text-zinc-500 hover:text-rose-300 hover:bg-rose-500/10 ml-auto">
          <Trash2 className="w-3.5 h-3.5 mr-1.5" />Dismiss
        </Button>
      </div>
    </div>
  )
}

function CardReviewModal({ card: initialCard, onClose, onApprove, onDismiss }) {
  const [card, setCard] = useState(initialCard)
  const [artifacts, setArtifacts] = useState(initialCard?.artifacts || {})
  const [edited, setEdited] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeSection, setActiveSection] = useState(null)
  const scrollRef = useRef(null)
  const sectionRefs = useRef({})

  useEffect(() => {
    setCard(initialCard)
    setArtifacts(initialCard?.artifacts || {})
    setEdited(false)
  }, [initialCard?.id])

  if (!card) return null
  const a = artifacts || {}

  const sections = []
  if (a.email) sections.push({ id: 'email', label: 'Email', icon: Mail })
  if (a.success_plan?.milestones?.length) sections.push({ id: 'success_plan', label: 'Success Plan', icon: Target })
  if (a.summary) sections.push({ id: 'summary', label: 'Summary', icon: FileText })
  if (a.crm_note) sections.push({ id: 'crm_note', label: 'CRM Note', icon: StickyNote })
  if (a.tasks?.length) sections.push({ id: 'tasks', label: 'Tasks', icon: ListTodo })
  sections.push({ id: 'context', label: 'Context', icon: BookOpen })

  const scrollTo = (id) => {
    const el = sectionRefs.current[id]
    const container = scrollRef.current
    if (el && container) {
      container.scrollTo({ top: el.offsetTop - 24, behavior: 'smooth' })
      setActiveSection(id)
    }
  }

  const updateArtifact = (key, value) => {
    setArtifacts(prev => ({ ...prev, [key]: typeof value === 'function' ? value(prev[key]) : value }))
    setEdited(true)
  }

  const saveEdits = async () => {
    setSaving(true)
    try {
      await api(`/workbench/cards/${card.id}/update`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ artifacts })
      })
      setEdited(false)
    } finally { setSaving(false) }
  }

  const regenerate = async () => {
    setRegenerating(true)
    try {
      const fresh = await api(`/workbench/cards/${card.id}/regenerate`, { method: 'POST' })
      setCard(fresh)
      setArtifacts(fresh.artifacts || {})
      setEdited(false)
    } finally { setRegenerating(false) }
  }

  const copyAll = async () => {
    const parts = []
    if (a.email) {
      parts.push(`To: ${(a.email.to||[]).join(', ')}`)
      parts.push(`Subject: ${a.email.subject || ''}`)
      parts.push('')
      parts.push(a.email.body || '')
    }
    if (a.summary) parts.push('\n--- Summary ---\n' + a.summary)
    if (a.crm_note) parts.push('\n--- CRM Note ---\n' + a.crm_note)
    if (a.success_plan?.milestones?.length) {
      parts.push('\n--- Success Plan ---')
      a.success_plan.milestones.forEach((m, i) => parts.push(`${i+1}. ${m.title} — ${m.owner} · ${m.due}\n   ${m.description}`))
    }
    if (a.tasks?.length) {
      parts.push('\n--- Tasks ---')
      a.tasks.forEach(t => parts.push(`[${t.priority}] ${t.title} — ${t.owner} · due ${t.due}`))
    }
    try {
      await navigator.clipboard.writeText(parts.join('\n'))
      setCopied(true); setTimeout(() => setCopied(false), 1500)
    } catch (e) { /* noop */ }
  }

  const handleApprove = async () => {
    if (edited) await saveEdits()
    onApprove()
  }

  const m = intentMeta(card.intent)
  const prioCls = card.priority === 'P0' ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
    : card.priority === 'P1' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    : 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30'

  return (
    <Dialog open={!!card} onOpenChange={onClose}>
      <DialogContent
        className="!max-w-none w-[90vw] h-[90vh] p-0 bg-[#0a0a0b] border-white/10 text-zinc-100 flex flex-col overflow-hidden gap-0"
        showCloseButton={false}
      >
        {/* STICKY HEADER */}
        <header className="shrink-0 border-b border-white/10 px-6 py-4 flex items-center gap-4 bg-[#0a0a0b]/95 backdrop-blur z-10">
          <Logo text={card.company?.logo} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <DialogTitle asChild>
                <input
                  value={card.title || ''}
                  onChange={(e) => { setCard({ ...card, title: e.target.value }); setEdited(true) }}
                  className="text-base font-semibold bg-transparent outline-none text-white min-w-0 hover:bg-white/[0.03] focus:bg-white/[0.05] rounded px-1.5 py-0.5 -mx-1.5"
                  style={{ width: `${Math.max(8, (card.title || '').length)}ch` }}
                />
              </DialogTitle>
              <Badge className={`${prioCls} border text-[10px]`}>{card.priority}</Badge>
              <Badge variant="outline" className="border-white/10 text-zinc-400 text-[10px]">
                <m.icon className="w-3 h-3 mr-1" />{m.label}
              </Badge>
              <Badge variant="outline" className="border-white/10 text-zinc-500 text-[10px]">
                <Clock className="w-3 h-3 mr-1" />~{card.estimated_seconds}s
              </Badge>
              {edited && <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 border text-[10px]">Edited</Badge>}
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">{card.company?.name} · {card.company?.industry}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* BODY: side nav + scrollable content */}
        <div className="flex-1 flex min-h-0">
          {/* Section nav */}
          <nav className="w-52 shrink-0 border-r border-white/5 bg-[#0c0c0e] py-4 px-3 overflow-y-auto">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 px-2 mb-2">Sections</div>
            <div className="space-y-0.5">
              {sections.map(s => {
                const Icon = s.icon
                return (
                  <button key={s.id} onClick={() => scrollTo(s.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-sm flex items-center gap-2 transition ${activeSection === s.id ? 'bg-white/5 text-white' : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'}`}>
                    <Icon className="w-3.5 h-3.5" />{s.label}
                  </button>
                )
              })}
            </div>

            <Separator className="my-4 bg-white/5" />
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 px-2 mb-2">Why this surfaced</div>
            <div className="px-2 text-xs text-zinc-400 leading-relaxed">{card.reason}</div>
            <div className="px-2 text-xs text-zinc-500 mt-3 leading-relaxed">
              <span className="text-zinc-300">Impact:</span> {card.business_impact}
            </div>
          </nav>

          {/* Scrollable content */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto py-10 px-10 space-y-12">
              {a.email && (
                <Section refMap={sectionRefs} id="email" icon={Mail} title="Email">
                  <EmailEditor email={a.email} onChange={(e) => updateArtifact('email', e)} />
                </Section>
              )}

              {a.success_plan?.milestones?.length > 0 && (
                <Section refMap={sectionRefs} id="success_plan" icon={Target} title="Success Plan">
                  <SuccessPlanEditor plan={a.success_plan} onChange={(p) => updateArtifact('success_plan', p)} />
                </Section>
              )}

              {a.summary && (
                <Section refMap={sectionRefs} id="summary" icon={FileText} title="Executive Summary">
                  <Editable value={a.summary} onChange={(v) => updateArtifact('summary', v)} multiline placeholder="Write a summary..." />
                </Section>
              )}

              {a.crm_note && (
                <Section refMap={sectionRefs} id="crm_note" icon={StickyNote} title="CRM Note">
                  <CrmNoteRenderer note={a.crm_note} onChange={(v) => updateArtifact('crm_note', v)} company={card.company} card={card} />
                </Section>
              )}

              {a.tasks?.length > 0 && (
                <Section refMap={sectionRefs} id="tasks" icon={ListTodo} title={`Tasks (${a.tasks.length})`}>
                  <TasksEditor tasks={a.tasks} onChange={(t) => updateArtifact('tasks', t)} />
                </Section>
              )}

              <Section refMap={sectionRefs} id="context" icon={BookOpen} title="Context">
                <div className="space-y-3 text-sm text-zinc-300">
                  <ContextRow label="Customer" value={card.company?.name} />
                  <ContextRow label="Plan" value={card.company?.plan} />
                  <ContextRow label="ARR" value={card.company?.arr ? `$${(card.company.arr/1000).toFixed(0)}k` : '—'} />
                  <ContextRow label="Health" value={`${card.company?.health} · ${card.company?.health_label}`} />
                  <ContextRow label="Renewal" value={card.company?.renewal_date ? `${daysUntil(card.company.renewal_date)} days` : '—'} />
                  <ContextRow label="Intent" value={m.label} />
                  <ContextRow label="Recommended" value={card.recommended_action} />
                  {card.prompt && <ContextRow label="From your prompt" value={`"${card.prompt}"`} />}
                </div>
              </Section>

              <div className="h-12" />
            </div>
          </div>
        </div>

        {/* STICKY FOOTER */}
        <footer className="shrink-0 border-t border-white/10 px-6 py-3 flex items-center gap-2 bg-[#0a0a0b]/95 backdrop-blur">
          <Button variant="ghost" size="sm" onClick={() => scrollTo(sections[0]?.id)} className="text-zinc-400 hover:text-white hover:bg-white/5">
            <FileText className="w-4 h-4 mr-1.5" />Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={regenerate} disabled={regenerating} className="text-zinc-400 hover:text-white hover:bg-white/5">
            {regenerating ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
            {regenerating ? 'Regenerating...' : 'Regenerate'}
          </Button>
          <Button variant="ghost" size="sm" onClick={copyAll} className="text-zinc-400 hover:text-white hover:bg-white/5">
            {copied ? <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-400" /> : <Copy className="w-4 h-4 mr-1.5" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
          {edited && (
            <Button variant="ghost" size="sm" onClick={saveEdits} disabled={saving} className="text-amber-300 hover:bg-amber-500/10">
              {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1.5" />}
              Save edits
            </Button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-zinc-400 hover:text-white">Cancel</Button>
            <Button size="sm" variant="ghost" onClick={onDismiss} className="text-zinc-500 hover:text-rose-300 hover:bg-rose-500/10">
              <Trash2 className="w-4 h-4 mr-1.5" />Dismiss
            </Button>
            <Button size="sm" onClick={handleApprove} className="bg-emerald-500 hover:bg-emerald-400 text-black font-medium">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />Approve &amp; Execute
            </Button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  )
}

function Section({ id, icon: Icon, title, children, refMap }) {
  return (
    <section ref={el => { if (refMap?.current) refMap.current[id] = el }} id={id} className="scroll-mt-6">
      <div className="flex items-center gap-2 mb-4 text-zinc-300">
        <Icon className="w-4 h-4 text-zinc-500" />
        <h2 className="text-sm font-medium uppercase tracking-wider">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function ContextRow({ label, value }) {
  return (
    <div className="flex gap-4 text-sm">
      <div className="w-32 shrink-0 text-zinc-500 text-xs uppercase tracking-wider pt-1">{label}</div>
      <div className="flex-1 text-zinc-200">{value || '—'}</div>
    </div>
  )
}

// Notion-style inline-editable text. Single-line or multiline.
function Editable({ value, onChange, multiline = false, placeholder = '', className = '' }) {
  const ref = useRef(null)
  useEffect(() => {
    // Only sync DOM if not focused, to avoid caret jumps while typing
    if (ref.current && document.activeElement !== ref.current && ref.current.innerText !== value) {
      ref.current.innerText = value || ''
    }
  }, [value])
  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onBlur={(e) => onChange(e.currentTarget.innerText)}
      className={`outline-none focus:ring-1 focus:ring-indigo-500/30 rounded-md px-3 py-2 -mx-3 hover:bg-white/[0.02] focus:bg-white/[0.03] transition text-[15px] leading-7 text-zinc-100 whitespace-pre-wrap empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-600 ${multiline ? '' : ''} ${className}`}
    />
  )
}

function EmailEditor({ email, onChange }) {
  const update = (k, v) => onChange({ ...email, [k]: v })
  const [tonesOpen, setTonesOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const recipients = email.to || []
  const sendTime = email.suggested_send_time || 'Tomorrow, 8:30 AM'

  const colorFor = (s) => {
    let h = 0; for (let i = 0; i < (s||'').length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
    return `hsl(${h % 360} 65% 55%)`
  }
  const initials = (s) => (s || '').split('@')[0].split('.').map(p => p[0]||'').join('').slice(0,2).toUpperCase()

  return (
    <div className="rounded-xl border border-white/10 bg-[#0c0c0e] overflow-hidden shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]">
      {/* Top metadata bar — Superhuman feel */}
      <div className="px-5 pt-4 pb-2 border-b border-white/5 space-y-2.5">
        <div className="flex items-center gap-3 text-[13px]">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-fuchsia-500 flex items-center justify-center text-[10px] font-semibold text-white">AP</div>
          <span className="text-zinc-500 font-mono uppercase tracking-wider text-[10px]">From</span>
          <span className="text-zinc-100">Alex Park &lt;alex.park@atlas.com&gt;</span>
        </div>
        <div className="flex items-center gap-3 text-[13px]">
          <span className="text-zinc-500 font-mono uppercase tracking-wider text-[10px] w-12">To</span>
          <div className="flex flex-wrap items-center gap-1.5 flex-1">
            {recipients.map((r, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 pl-0.5 pr-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-[12px] text-zinc-100">
                <span className="w-4 h-4 rounded-full text-[8px] font-semibold flex items-center justify-center text-white" style={{ background: colorFor(r) }}>{initials(r)}</span>
                {r}
              </span>
            ))}
            <input
              defaultValue=""
              onBlur={(e) => { if (e.target.value.trim()) { update('to', [...recipients, e.target.value.trim()]); e.target.value = '' } }}
              placeholder={recipients.length ? '' : 'Add recipient...'}
              className="flex-1 min-w-[8ch] bg-transparent outline-none text-[12px] text-zinc-300"
            />
            <button onClick={() => update('to', recipients.slice(0,-1))} className="text-zinc-600 hover:text-rose-300 text-[10px]">⌫</button>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[13px]">
          <span className="text-zinc-500 font-mono uppercase tracking-wider text-[10px] w-12">Subject</span>
          <input value={email.subject || ''} onChange={(e) => update('subject', e.target.value)}
            className="flex-1 bg-transparent outline-none text-[15px] font-medium text-white" />
        </div>
      </div>

      {/* Body in reading typography */}
      <div className="px-5 py-6">
        <Editable value={email.body || ''} onChange={(v) => update('body', v)} multiline
          placeholder="Write the email body..."
          className="!text-[15px] !leading-[1.75] font-serif tracking-[-0.005em]"
        />
      </div>

      {/* Composer toolbar — Superhuman vibe */}
      <div className="px-4 py-3 border-t border-white/5 bg-[#0a0a0b] flex items-center gap-2 flex-wrap">
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-medium">
          <Send className="w-3.5 h-3.5" />Send
          <kbd className="ml-1 px-1 py-0.5 rounded text-[9px] bg-black/30 text-white/70 font-mono">⌘↵</kbd>
        </button>
        <div className="relative">
          <button onClick={() => setScheduleOpen(o => !o)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-zinc-200 text-xs">
            <AlarmClock className="w-3.5 h-3.5" />Schedule · <span className="text-indigo-300">{sendTime}</span>
          </button>
          {scheduleOpen && (
            <div className="absolute z-30 mt-1 left-0 w-56 p-2 rounded-lg bg-[#111114] border border-white/10 shadow-2xl space-y-1 text-xs">
              {['In 1 hour','Tomorrow, 8:30 AM','Tomorrow, 9:00 AM','Monday, 9:00 AM','Custom…'].map(t => (
                <button key={t} onClick={() => { update('suggested_send_time', t); setScheduleOpen(false) }} className="w-full text-left px-2 py-1.5 rounded hover:bg-white/5 text-zinc-200">{t}</button>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <button onClick={() => setTonesOpen(o => !o)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-zinc-200 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />AI tone
          </button>
          {tonesOpen && (
            <div className="absolute z-30 mt-1 left-0 w-44 p-2 rounded-lg bg-[#111114] border border-white/10 shadow-2xl space-y-1 text-xs">
              {['More concise','More empathetic','More direct','Executive tone','Friendly'].map(t => (
                <button key={t} className="w-full text-left px-2 py-1.5 rounded hover:bg-white/5 text-zinc-200">{t}</button>
              ))}
            </div>
          )}
        </div>
        <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-zinc-200 text-xs">
          <FileText className="w-3.5 h-3.5" />Templates
        </button>
        <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-zinc-200 text-xs">
          📎 Attach
        </button>
        <div className="ml-auto flex items-center gap-3 text-[10px] text-zinc-500 font-mono">
          <span><kbd className="px-1 py-0.5 rounded bg-white/5">J</kbd>/<kbd className="px-1 py-0.5 rounded bg-white/5">K</kbd> navigate</span>
          <span><kbd className="px-1 py-0.5 rounded bg-white/5">E</kbd> archive</span>
          <span><kbd className="px-1 py-0.5 rounded bg-white/5">Z</kbd> snooze</span>
        </div>
      </div>
    </div>
  )
}

// Salesforce-style CRM Note renderer
function CrmNoteRenderer({ note, onChange, company, card }) {
  const today = new Date()
  const fmt = today.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })
  return (
    <div className="rounded-xl border border-white/10 bg-[#0c0c0e] overflow-hidden">
      {/* Salesforce-style record header */}
      <div className="px-5 py-4 border-b border-white/5 bg-gradient-to-r from-[#0b3d91]/20 to-transparent flex items-center gap-3">
        <div className="w-9 h-9 rounded-md bg-[#1798c1] flex items-center justify-center">
          <StickyNote className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Activity · Note</div>
          <div className="text-sm font-medium text-white">{card?.title || `Note · ${company?.name}`}</div>
        </div>
        <Badge className="bg-[#1798c1]/20 text-[#5cd5fa] border border-[#1798c1]/40 text-[10px]">Logged</Badge>
      </div>

      <div className="grid grid-cols-12 gap-0">
        {/* Fields */}
        <div className="col-span-12 md:col-span-8 p-5 border-r border-white/5 space-y-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <CrmField label="Related to" value={`Account · ${company?.name}`} highlight />
            <CrmField label="Type" value="Customer Success · QBR Follow-up" />
            <CrmField label="Account owner" value="Alex Park" />
            <CrmField label="Date" value={fmt} />
            <CrmField label="Status" value="Completed" />
            <CrmField label="Visibility" value="Internal" />
          </div>
          <Separator className="bg-white/5" />
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 mb-2">Description</div>
            <Editable value={note || ''} onChange={onChange} multiline placeholder="Activity details..." />
          </div>
        </div>
        {/* Related panel */}
        <aside className="col-span-12 md:col-span-4 p-5 bg-[#0a0a0b] space-y-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 mb-2">Related account</div>
            <div className="flex items-center gap-2 p-2 rounded-md bg-white/[0.02] border border-white/5">
              <Logo text={company?.logo} size="sm" />
              <div className="flex-1">
                <div className="text-xs text-white">{company?.name}</div>
                <div className="text-[10px] text-zinc-500">{company?.industry} · {company?.region}</div>
              </div>
              <ChevronRight className="w-3 h-3 text-zinc-600" />
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 mb-2">Open opportunity</div>
            <div className="p-2 rounded-md bg-white/[0.02] border border-white/5 text-xs">
              <div className="text-white">{company?.current_opportunity || `${company?.name} Renewal FY26`}</div>
              <div className="text-zinc-500 mt-0.5">Stage: <span className="text-indigo-300">Negotiation</span> · {company?.arr ? `$${(company.arr/1000).toFixed(0)}k` : ''}</div>
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 mb-2">Key contacts</div>
            <div className="space-y-1.5">
              {(company?.decision_makers || []).slice(0,3).map(n => (
                <div key={n} className="flex items-center gap-2 text-xs">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-[9px] font-semibold">{n.split(' ').map(p=>p[0]).slice(0,2).join('')}</div>
                  <div className="text-zinc-200 truncate">{n}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-[10px] text-zinc-600 leading-relaxed">Synced to <span className="text-zinc-400">Salesforce</span> · CRM ID will be assigned on approval</div>
        </aside>
      </div>
    </div>
  )
}
function CrmField({ label, value, highlight }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">{label}</div>
      <div className={`text-sm mt-0.5 ${highlight ? 'text-indigo-300 underline decoration-dotted underline-offset-2' : 'text-zinc-100'}`}>{value}</div>
    </div>
  )
}

function SuccessPlanEditor({ plan, onChange }) {
  const update = (i, k, v) => {
    const milestones = plan.milestones.map((m, idx) => idx === i ? { ...m, [k]: v } : m)
    onChange({ ...plan, milestones })
  }
  const remove = (i) => onChange({ ...plan, milestones: plan.milestones.filter((_, idx) => idx !== i) })
  return (
    <div className="space-y-3">
      {plan.milestones.map((m, i) => (
        <div key={i} className="group p-4 rounded-lg bg-[#0c0c0e] border border-white/5 hover:border-white/10 transition">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono text-zinc-500 w-6">{(i+1).toString().padStart(2,'0')}</span>
            <input
              value={m.title || ''}
              onChange={(e) => update(i, 'title', e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm font-medium text-white"
            />
            <input
              value={m.owner || ''}
              onChange={(e) => update(i, 'owner', e.target.value)}
              className="bg-transparent outline-none text-xs text-zinc-400 w-32 text-right"
            />
            <span className="text-zinc-600">·</span>
            <input
              value={m.due || ''}
              onChange={(e) => update(i, 'due', e.target.value)}
              className="bg-transparent outline-none text-xs text-zinc-400 w-28 text-right"
            />
            <button onClick={() => remove(i)} className="opacity-0 group-hover:opacity-100 transition text-zinc-500 hover:text-rose-300 ml-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="ml-8">
            <Editable value={m.description || ''} onChange={(v) => update(i, 'description', v)} multiline placeholder="Describe this milestone..." />
          </div>
        </div>
      ))}
    </div>
  )
}

function TasksEditor({ tasks, onChange }) {
  const update = (i, k, v) => onChange(tasks.map((t, idx) => idx === i ? { ...t, [k]: v } : t))
  const remove = (i) => onChange(tasks.filter((_, idx) => idx !== i))
  const add = () => onChange([...tasks, { title: '', owner: 'You', due: '', priority: 'P2' }])
  return (
    <div className="space-y-2">
      {tasks.map((t, i) => (
        <div key={i} className="group flex items-center gap-3 p-3 rounded-md bg-[#0c0c0e] border border-white/5 hover:border-white/10 transition">
          <select
            value={t.priority}
            onChange={(e) => update(i, 'priority', e.target.value)}
            className={`bg-transparent outline-none text-[10px] px-2 py-0.5 rounded border ${t.priority==='P1'?'bg-rose-500/20 text-rose-300 border-rose-500/30':t.priority==='P2'?'bg-amber-500/20 text-amber-300 border-amber-500/30':'bg-zinc-700/40 text-zinc-300 border-zinc-600/40'}`}
          >
            <option value="P1">P1</option><option value="P2">P2</option><option value="P3">P3</option>
          </select>
          <input
            value={t.title || ''}
            onChange={(e) => update(i, 'title', e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-white"
            placeholder="Task title..."
          />
          <input
            value={t.owner || ''}
            onChange={(e) => update(i, 'owner', e.target.value)}
            className="bg-transparent outline-none text-xs text-zinc-400 w-28 text-right"
          />
          <span className="text-zinc-600">·</span>
          <input
            value={t.due || ''}
            onChange={(e) => update(i, 'due', e.target.value)}
            className="bg-transparent outline-none text-xs text-zinc-400 w-28 text-right"
          />
          <button onClick={() => remove(i)} className="opacity-0 group-hover:opacity-100 transition text-zinc-500 hover:text-rose-300">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button onClick={add} className="w-full p-2.5 rounded-md border border-dashed border-white/10 text-xs text-zinc-500 hover:text-zinc-300 hover:border-white/20 transition">
        + Add task
      </button>
    </div>
  )
}

// ============== ENTERPRISE WORKSPACE ADDITIONS ==============

const fmtMoney = (n) => {
  if (n == null) return '—'
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `$${(n/1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `$${(n/1000).toFixed(n%1000===0?0:1)}k`
  return `$${n.toLocaleString()}`
}
const fmtNum = (n) => n?.toLocaleString?.() ?? '—'

function ConfidencePill({ score, expanded, evidence, reasoning, missing }) {
  const [open, setOpen] = useState(false)
  const color = score >= 85 ? 'emerald' : score >= 70 ? 'indigo' : score >= 50 ? 'amber' : 'rose'
  const cls = {
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    indigo: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    rose: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  }[color]
  return (
    <div className="relative inline-block">
      <button onClick={() => setOpen(o => !o)} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium ${cls}`}>
        <Sparkles className="w-3 h-3" />Atlas confidence · {score}%
        <ChevronRight className={`w-3 h-3 transition ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (reasoning || evidence?.length) && (
        <div className="absolute z-30 mt-2 right-0 w-96 p-4 rounded-lg bg-[#111114] border border-white/10 shadow-2xl text-xs space-y-3">
          {reasoning && <div><div className="text-zinc-500 uppercase tracking-wider mb-1">Reasoning</div><div className="text-zinc-200 leading-relaxed">{reasoning}</div></div>}
          {evidence?.length > 0 && <div><div className="text-zinc-500 uppercase tracking-wider mb-1">Evidence used</div><ul className="space-y-1">{evidence.map((e,i) => <li key={i} className="text-zinc-200">· {e}</li>)}</ul></div>}
          {missing?.length > 0 && <div><div className="text-zinc-500 uppercase tracking-wider mb-1">Missing information</div><ul className="space-y-1">{missing.map((m,i) => <li key={i} className="text-amber-300">· {m}</li>)}</ul></div>}
        </div>
      )}
    </div>
  )
}

function SourceChip({ app, name, timestamp, confidence }) {
  const icons = {
    Salesforce: '🟦', Stripe: '🟪', Chargebee: '🟫', Gmail: '📧', Slack: '💬',
    Zendesk: '🎫', 'CRM Timeline': '📋', 'Product Usage': '📈', 'Meeting Notes': '📝',
  }
  return (
    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/10 text-xs hover:bg-white/[0.06] transition cursor-pointer">
      <span className="text-[10px]">{icons[app] || '🔗'}</span>
      <span className="text-zinc-400">{app}</span>
      <span className="text-zinc-200">·</span>
      <span className="text-zinc-200 max-w-[14ch] truncate">{name}</span>
      {timestamp && <span className="text-zinc-500">·</span>}
      {timestamp && <span className="text-zinc-500 font-mono">{timestamp}</span>}
      {confidence != null && <span className="text-emerald-300 font-mono">{confidence}%</span>}
    </div>
  )
}

function ExecutiveHeader({ company, onAction }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#0f0f12] via-[#0e0e10] to-[#0a0a0b] border border-white/5 overflow-hidden">
      <div className="p-6 grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-7 flex gap-5">
          <Logo text={company.logo} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold tracking-tight text-white">{company.name}</h1>
              <HealthPill score={company.health} label={company.health_label} trend={company.health_trend} />
              <ConfidencePill score={company.atlas_confidence}
                reasoning={`Confidence based on completeness of signal: ${company.atlas_confidence >= 85 ? 'strong recent activity, champion engaged, clear renewal path' : company.atlas_confidence >= 70 ? 'solid signal but watch items present' : 'incomplete picture or active risk'}.`}
                evidence={[
                  `Health score ${company.health} (${company.health_trend})`,
                  `${company.purchased_products?.length || 0} products in use, ${company.seats_used}/${company.seats_purchased} seats active`,
                  `Last login ${company.last_login ? new Date(company.last_login).toLocaleString() : '—'}`,
                  `Renewal in ${daysUntil(company.renewal_date)} days`,
                ]}
                missing={company.health < 70 ? ['Recent NPS survey response','Executive sponsor 1:1 in last 60d'] : []}
              />
            </div>
            <div className="text-sm text-zinc-500 mt-1">{company.industry} · {company.region} · {fmtNum(company.employees)} employees · customer since {company.customer_since}</div>

            <p className="text-[15px] text-zinc-200 mt-4 leading-relaxed">
              <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500 uppercase tracking-wider mr-2"><Sparkles className="w-3 h-3 text-indigo-400" />Atlas summary</span>
              {company.atlas_executive_summary}
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              <QuickAction icon={Sparkles} label="Generate Brief" onClick={() => onAction('brief')} />
              <QuickAction icon={FileText} label="Generate QBR" onClick={() => onAction('qbr')} />
              <QuickAction icon={Zap} label="Build Quote" onClick={() => onAction('quote')} primary />
              <QuickAction icon={Mail} label="Draft Email" onClick={() => onAction('email')} />
              <QuickAction icon={Calendar} label="Schedule Meeting" onClick={() => onAction('meeting')} />
              <QuickAction icon={Target} label="Success Plan" onClick={() => onAction('plan')} />
              <QuickAction icon={StickyNote} label="Update CRM" onClick={() => onAction('crm')} />
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 grid grid-cols-2 gap-3">
          <MiniMetric label="ARR" value={fmtMoney(company.arr)} sub={`MRR ${fmtMoney(company.mrr)}`} />
          <MiniMetric label="Renewal" value={`${daysUntil(company.renewal_date)} days`} sub={new Date(company.renewal_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})} tone={daysUntil(company.renewal_date) < 30 ? 'amber' : 'default'} />
          <MiniMetric label="Last renewal" value={company.last_renewal_date || '—'} sub="Contract anniversary" />
          <MiniMetric label="Contract start" value={company.contract_start || '—'} sub={`Plan: ${company.plan}`} />
          <div className="col-span-2 p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1.5">
            <Row label="Champion" value={company.champion} />
            <Row label="Exec sponsor" value={company.exec_sponsor} />
            <Row label="Decision makers" value={(company.decision_makers || []).join(' · ')} />
          </div>
          <div className="col-span-2 p-3 rounded-lg bg-rose-500/5 border border-rose-500/20 space-y-1.5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-rose-300"><AlertTriangle className="w-3 h-3" />Primary risk</div>
            <div className="text-sm text-zinc-200">{company.primary_risk}</div>
          </div>
          <div className="col-span-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-1.5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-emerald-300"><TrendingUp className="w-3 h-3" />Current opportunity</div>
            <div className="text-sm text-zinc-200">{company.current_opportunity}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickAction({ icon: Icon, label, onClick, primary }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${primary ? 'bg-indigo-500 hover:bg-indigo-400 text-white' : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 border border-white/5'}`}>
      <Icon className="w-3.5 h-3.5" />{label}
    </button>
  )
}
function MiniMetric({ label, value, sub, tone }) {
  const toneCls = tone === 'amber' ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/5 bg-white/[0.02]'
  return (
    <div className={`p-3 rounded-lg border ${toneCls}`}>
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="text-lg font-semibold text-white mt-0.5">{value}</div>
      {sub && <div className="text-[11px] text-zinc-500 mt-0.5">{sub}</div>}
    </div>
  )
}
function Row({ label, value }) {
  return (
    <div className="flex gap-2 text-xs">
      <div className="text-zinc-500 w-28 shrink-0 uppercase tracking-wider">{label}</div>
      <div className="text-zinc-200 flex-1">{value || '—'}</div>
    </div>
  )
}

// ---------- ADOPTION TAB ----------
function AdoptionTab({ company }) {
  const seatPct = company.seats_purchased ? Math.round((company.seats_used / company.seats_purchased)*100) : 0
  const storagePct = company.storage_total_gb ? Math.round((company.storage_used_gb / company.storage_total_gb)*100) : 0
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <BigMetric label="Daily Active" value={fmtNum(company.dau)} sub={`of ${fmtNum(company.mau)} monthly`} tone="indigo" />
        <BigMetric label="Weekly Active" value={fmtNum(company.wau)} sub={`${Math.round((company.wau/company.mau)*100)}% stickiness`} tone="violet" />
        <BigMetric label="Monthly Active" value={fmtNum(company.mau)} sub={`of ${fmtNum(company.seats_purchased)} licensed`} tone="emerald" />
        <BigMetric label="API calls / mo" value={(company.api_usage_monthly/1_000_000).toFixed(1)+'M'} sub="rolling 30d" tone="amber" />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 lg:col-span-7 bg-[#0f0f12] border-white/5 p-5">
          <SectionTitle icon={Activity}>30-day adoption trend</SectionTitle>
          <AdoptionSpark data={company.adoption_trend || []} />
        </Card>
        <Card className="col-span-12 lg:col-span-5 bg-[#0f0f12] border-white/5 p-5 space-y-3">
          <SectionTitle icon={Target}>Capacity</SectionTitle>
          <Utilization label="Seats" used={company.seats_used} total={company.seats_purchased} pct={seatPct} unit="" />
          <Utilization label="Storage" used={company.storage_used_gb} total={company.storage_total_gb} pct={storagePct} unit=" GB" />
        </Card>
        <Card className="col-span-12 lg:col-span-7 bg-[#0f0f12] border-white/5 p-5">
          <SectionTitle icon={Sparkles}>Feature adoption</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {(company.feature_adoption || []).map(f => <FeatureBar key={f.feature} feat={f} />)}
          </div>
        </Card>
        <Card className="col-span-12 lg:col-span-5 bg-[#0f0f12] border-white/5 p-5">
          <SectionTitle icon={Users}>Users</SectionTitle>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-zinc-500 uppercase tracking-wider mb-2">Power users · {company.power_users?.length || 0}</div>
              <div className="space-y-1">{(company.power_users||[]).map(u => (
                <div key={u} className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /><span className="text-zinc-200">{u}</span></div>
              ))}</div>
            </div>
            <div>
              <div className="text-zinc-500 uppercase tracking-wider mb-2">Inactive 30d+ · {company.inactive_users?.length || 0}</div>
              <div className="space-y-1">{(company.inactive_users||[]).map(u => (
                <div key={u} className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-zinc-600" /><span className="text-zinc-400">{u}</span></div>
              ))}</div>
            </div>
          </div>
          <Separator className="my-3 bg-white/5" />
          <div className="text-xs text-zinc-500">Last login: <span className="text-zinc-200">{company.last_login ? new Date(company.last_login).toLocaleString() : '—'}</span></div>
        </Card>
      </div>
    </div>
  )
}
function BigMetric({ label, value, sub, tone }) {
  const tones = { indigo: 'text-indigo-300', violet: 'text-violet-300', emerald: 'text-emerald-300', amber: 'text-amber-300' }[tone] || 'text-white'
  return (
    <div className="p-4 rounded-lg bg-[#0f0f12] border border-white/5">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${tones}`}>{value}</div>
      <div className="text-[11px] text-zinc-500 mt-0.5">{sub}</div>
    </div>
  )
}
function Utilization({ label, used, total, pct, unit }) {
  const tone = pct >= 90 ? 'rose' : pct >= 70 ? 'amber' : 'emerald'
  const bar = { rose: 'bg-rose-400', amber: 'bg-amber-400', emerald: 'bg-emerald-400' }[tone]
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5"><span className="text-zinc-400">{label}</span><span className="text-zinc-200 font-mono">{fmtNum(used)}{unit} / {fmtNum(total)}{unit} · {pct}%</span></div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden"><div className={`h-full ${bar} transition-all`} style={{ width: `${Math.min(100,pct)}%` }} /></div>
    </div>
  )
}
function FeatureBar({ feat }) {
  const trendN = parseInt(feat.trend)
  const trendC = trendN > 0 ? 'text-emerald-400' : trendN < 0 ? 'text-rose-400' : 'text-zinc-500'
  const barC = feat.adoption >= 75 ? 'bg-emerald-500' : feat.adoption >= 40 ? 'bg-indigo-500' : 'bg-rose-500'
  return (
    <div>
      <div className="flex justify-between text-xs mb-1"><span className="text-zinc-300">{feat.feature}</span><span className={trendC + ' font-mono'}>{feat.trend}</span></div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden"><div className={`h-full ${barC}`} style={{ width: `${feat.adoption}%` }} /></div>
      <div className="text-[10px] text-zinc-500 mt-0.5 font-mono">{feat.adoption}%</div>
    </div>
  )
}
function AdoptionSpark({ data }) {
  if (!data?.length) return <div className="text-xs text-zinc-500 py-6">No data</div>
  const max = Math.max(...data.map(d => d.dau)) || 1
  const min = Math.min(...data.map(d => d.dau)) || 0
  const w = 100, h = 60
  const pts = data.map((d,i) => `${(i/(data.length-1))*w},${h - ((d.dau-min)/(max-min||1))*h}`).join(' ')
  const area = `M0,${h} L${pts.split(' ').map(p=>p).join(' L')} L${w},${h} Z`
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-40" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#sparkFill)" />
        <polyline points={pts} fill="none" stroke="#818cf8" strokeWidth="0.8" />
      </svg>
      <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-1">
        <span>{data[0]?.date}</span>
        <span>Peak {fmtNum(max)} · Low {fmtNum(min)}</span>
        <span>{data[data.length-1]?.date}</span>
      </div>
    </div>
  )
}

// ---------- BILLING & COMMERCIAL TAB ----------
function BillingTab({ company, invoices, onBuildQuote }) {
  const statusColor = (s) => ({
    paid: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    outstanding: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    overdue: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    scheduled: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  }[s] || 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30')
  const upcoming = invoices?.find(i => i.status === 'scheduled')
  const last = invoices?.find(i => i.status === 'paid')
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 lg:col-span-7 bg-[#0f0f12] border-white/5 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <SectionTitle icon={FileText}>Current contract</SectionTitle>
            <Button size="sm" onClick={onBuildQuote} className="bg-indigo-500 hover:bg-indigo-400 text-white">
              <Zap className="w-3.5 h-3.5 mr-1.5" />Build quote
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <MiniMetric label="ARR" value={fmtMoney(company.arr)} sub="Net price" />
            <MiniMetric label="MRR" value={fmtMoney(company.mrr)} sub={company.billing_frequency} />
            <MiniMetric label="List price" value={fmtMoney(company.list_price)} sub={`${company.discount}% discount`} />
            <MiniMetric label="Net price" value={fmtMoney(company.net_price)} sub="Per year" />
            <MiniMetric label="Payment terms" value={company.payment_terms || '—'} sub="Standard" />
            <MiniMetric label="Outstanding" value={fmtMoney(company.outstanding_balance)} sub={company.outstanding_balance ? 'Past due' : 'Up to date'} tone={company.outstanding_balance ? 'amber' : 'default'} />
          </div>
          <Separator className="bg-white/5" />
          <div className="grid grid-cols-2 gap-3 text-xs">
            <Row label="Contract start" value={company.contract_start} />
            <Row label="Last renewal" value={company.last_renewal_date} />
            <Row label="Next renewal" value={new Date(company.renewal_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})} />
            <Row label="Plan" value={company.plan} />
            <Row label="Partner" value={company.partner ? `${company.partner} · ${company.partner_margin}% margin` : 'Direct'} />
            <Row label="Contract" value={company.contract_pdf_url ? <a className="text-indigo-400 hover:underline" href="#">{company.contract_pdf_url.split('/').pop()}</a> : '—'} />
          </div>
        </Card>
        <Card className="col-span-12 lg:col-span-5 bg-[#0f0f12] border-white/5 p-5 space-y-4">
          <SectionTitle icon={Activity}>Cashflow</SectionTitle>
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500">Next invoice</div>
            {upcoming ? (
              <>
                <div className="flex items-baseline gap-2 mt-1">
                  <div className="text-2xl font-semibold text-white">{fmtMoney(upcoming.amount)}</div>
                  <div className="text-xs text-zinc-500">due {upcoming.due_date}</div>
                </div>
                <div className="text-xs text-zinc-400">{upcoming.number} · {upcoming.period}</div>
              </>
            ) : <div className="text-sm text-zinc-500 mt-1">No upcoming invoice scheduled</div>}
          </div>
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500">Last invoice</div>
            {last ? (
              <>
                <div className="flex items-baseline gap-2 mt-1">
                  <div className="text-xl font-semibold text-white">{fmtMoney(last.amount)}</div>
                  <Badge className={`${statusColor('paid')} border text-[10px]`}>paid</Badge>
                </div>
                <div className="text-xs text-zinc-400">{last.number} · {last.date}</div>
              </>
            ) : <div className="text-sm text-zinc-500 mt-1">—</div>}
          </div>
          <div className="text-xs space-y-1">
            <Row label="Revenue recognition" value={company.billing_frequency === 'Annual' ? 'Straight-line, 12 months' : 'Per period'} />
            <Row label="Credit notes" value="$0 outstanding" />
            <Row label="Refunds (12mo)" value="$0" />
          </div>
        </Card>

        <Card className="col-span-12 bg-[#0f0f12] border-white/5 p-5">
          <SectionTitle icon={ListTodo}>Invoice history</SectionTitle>
          <div className="overflow-hidden rounded-lg border border-white/5">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.02] text-[11px] uppercase tracking-wider text-zinc-500">
                <tr><th className="text-left px-4 py-2">Invoice</th><th className="text-left px-4 py-2">Period</th><th className="text-left px-4 py-2">Date</th><th className="text-left px-4 py-2">Due</th><th className="text-right px-4 py-2">Amount</th><th className="text-left px-4 py-2 pl-4">Status</th></tr>
              </thead>
              <tbody>
                {(invoices || []).map(inv => (
                  <tr key={inv.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5 font-mono text-zinc-300">{inv.number}</td>
                    <td className="px-4 py-2.5 text-zinc-400">{inv.period}</td>
                    <td className="px-4 py-2.5 text-zinc-400 font-mono text-xs">{inv.date}</td>
                    <td className="px-4 py-2.5 text-zinc-400 font-mono text-xs">{inv.due_date}</td>
                    <td className="px-4 py-2.5 text-right text-zinc-100 font-medium">{fmtMoney(inv.amount)}</td>
                    <td className="px-4 py-2.5"><Badge className={`${statusColor(inv.status)} border text-[10px]`}>{inv.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}

// ---------- QUOTE BUILDER ----------
function QuoteBuilder({ company, open, onClose }) {
  const [products, setProducts] = useState([])
  const [items, setItems] = useState([])
  const [discount, setDiscount] = useState(company?.discount || 10)
  const [calc, setCalc] = useState(null)
  const [computing, setComputing] = useState(false)
  const [step, setStep] = useState('build') // build | quote

  useEffect(() => {
    if (open) {
      api('/products').then(setProducts)
      setItems([{ product_id: 'p-enterprise-plus', quantity: 25, action: 'add' }])
      setDiscount(company?.discount || 10)
      setStep('build')
    }
  }, [open, company?.id])

  useEffect(() => {
    if (!open || !company) return
    const id = setTimeout(async () => {
      setComputing(true)
      const r = await api('/quote/calculate', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ company_id: company.id, line_items: items, discount_pct: discount }) })
      setCalc(r); setComputing(false)
    }, 200)
    return () => clearTimeout(id)
  }, [items, discount, open, company?.id])

  if (!open || !company) return null
  const approvalTone = calc?.approval_required === 'auto' ? 'emerald' : calc?.approval_required === 'vp' ? 'amber' : 'rose'

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-none w-[88vw] h-[88vh] p-0 bg-[#0a0a0b] border-white/10 text-zinc-100 flex flex-col overflow-hidden gap-0" showCloseButton={false}>
        <header className="shrink-0 border-b border-white/10 px-6 py-4 flex items-center gap-4 bg-[#0a0a0b]/95">
          <Logo text={company.logo} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">Quote Builder · {company.name}</h2>
              <Badge className="bg-violet-500/15 text-violet-300 border-violet-500/30 border text-[10px]">Commercial</Badge>
            </div>
            <div className="text-xs text-zinc-500">Live calculation · Current ARR {fmtMoney(company.arr)} · Renewal {daysUntil(company.renewal_date)} days</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-white/5 flex items-center justify-center text-zinc-400"><X className="w-4 h-4" /></button>
        </header>

        <div className="flex-1 flex min-h-0">
          {/* Builder */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6 border-r border-white/5">
            <section>
              <SectionTitle icon={ListTodo}>Line items</SectionTitle>
              <div className="space-y-2">
                {items.map((li, i) => {
                  const p = products.find(p => p.id === li.product_id)
                  return (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center p-3 rounded-lg bg-[#0f0f12] border border-white/5">
                      <select value={li.action} onChange={e => setItems(items.map((it,idx)=>idx===i?{...it,action:e.target.value}:it))}
                        className="col-span-2 bg-transparent border border-white/10 rounded px-2 py-1.5 text-xs outline-none">
                        <option value="add">Add</option><option value="remove">Remove</option><option value="upgrade">Upgrade</option>
                      </select>
                      <select value={li.product_id} onChange={e => setItems(items.map((it,idx)=>idx===i?{...it,product_id:e.target.value}:it))}
                        className="col-span-6 bg-transparent border border-white/10 rounded px-2 py-1.5 text-sm outline-none text-white">
                        {products.map(p => <option key={p.id} value={p.id} className="bg-[#0f0f12]">{p.name} {p.flat_annual ? `(${fmtMoney(p.flat_annual)}/yr flat)` : `($${p.price_per_seat}/seat/yr)`}</option>)}
                      </select>
                      <input type="number" value={li.quantity} onChange={e => setItems(items.map((it,idx)=>idx===i?{...it,quantity:parseInt(e.target.value)||0}:it))}
                        className="col-span-2 bg-transparent border border-white/10 rounded px-2 py-1.5 text-sm outline-none text-white text-right" placeholder="Qty" />
                      <div className="col-span-1 text-xs text-zinc-500 text-right">{p && fmtMoney((p.price_per_seat || 0) * (li.quantity||0) * (li.action==='remove'?-1:1))}</div>
                      <button onClick={() => setItems(items.filter((_,idx)=>idx!==i))} className="col-span-1 text-zinc-500 hover:text-rose-300"><X className="w-3.5 h-3.5 ml-auto" /></button>
                    </div>
                  )
                })}
                <button onClick={() => setItems([...items, { product_id: products[0]?.id || 'p-core', quantity: 10, action: 'add' }])}
                  className="w-full p-2.5 rounded-md border border-dashed border-white/10 text-xs text-zinc-500 hover:text-zinc-300 hover:border-white/20">+ Add line item</button>
              </div>
            </section>

            <section>
              <SectionTitle icon={Target}>Discount</SectionTitle>
              <div className="p-4 rounded-lg bg-[#0f0f12] border border-white/5">
                <div className="flex items-baseline gap-3">
                  <div className="text-3xl font-semibold text-white">{discount}%</div>
                  <div className="text-xs text-zinc-500">applied to new revenue</div>
                </div>
                <input type="range" min="0" max="50" value={discount} onChange={e => setDiscount(parseInt(e.target.value))}
                  className="w-full mt-3 accent-indigo-500" />
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                  <span>0%</span><span>15% (auto)</span><span>25% (VP)</span><span>40% (CFO)</span><span>50%</span>
                </div>
              </div>
            </section>

            <section>
              <SectionTitle icon={BookOpen}>Atlas Knowledge says</SectionTitle>
              <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20 text-xs text-zinc-200">
                {discount <= 15 && <>Within CSM auto-approval (≤15%). No further signoff needed.</>}
                {discount > 15 && discount <= 25 && <>Requires <span className="text-amber-300 font-medium">VP Customer Success</span> approval (15–25% range).</>}
                {discount > 25 && discount <= 40 && <>Requires <span className="text-rose-300 font-medium">CFO</span> approval (25–40% range). File via deal-desk@atlas.com with revenue justification.</>}
                {discount > 40 && <>Requires <span className="text-rose-300 font-medium">Executive Committee</span> approval (CEO + CFO).</>}
                <div className="mt-2"><SourceChip app="Atlas Knowledge" name="Discount Authorization Matrix" timestamp="updated today" confidence={100} /></div>
              </div>
            </section>
          </div>

          {/* Live calc */}
          <aside className="w-[420px] shrink-0 bg-[#0c0c0e] flex flex-col">
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="text-xs uppercase tracking-wider text-zinc-500">Live calculation {computing && <Loader2 className="w-3 h-3 animate-spin inline ml-2 text-indigo-400" />}</div>
              {calc && (
                <>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-zinc-500">Current ARR</span><span className="text-zinc-200 font-mono">{fmtMoney(calc.company.current_arr)}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Gross additional</span><span className="text-zinc-200 font-mono">+{fmtMoney(calc.gross_additional_arr)}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Discount</span><span className="text-rose-300 font-mono">-{fmtMoney(calc.discount_amount)} ({calc.discount_pct}%)</span></div>
                    <Separator className="my-2 bg-white/10" />
                    <div className="flex justify-between"><span className="text-zinc-300 font-medium">Additional ARR</span><span className="text-emerald-300 font-mono font-semibold">+{fmtMoney(calc.additional_arr)}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Additional MRR</span><span className="text-zinc-300 font-mono">+{fmtMoney(calc.additional_mrr)}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Prorated (this term)</span><span className="text-zinc-300 font-mono">{fmtMoney(calc.prorated_amount)} <span className="text-zinc-500">({calc.days_remaining}d left)</span></span></div>
                    <Separator className="my-2 bg-white/10" />
                    <div className="flex justify-between"><span className="text-zinc-300 font-medium">New ARR</span><span className="text-white font-mono font-semibold">{fmtMoney(calc.new_arr)}</span></div>
                  </div>

                  <div className={`p-3 rounded-lg border bg-${approvalTone}-500/5 border-${approvalTone}-500/30`}>
                    <div className={`text-[10px] uppercase tracking-wider text-${approvalTone}-300`}>Approval routing</div>
                    <div className="text-sm text-white mt-1 font-medium">{calc.approver}</div>
                    <div className="text-xs text-zinc-400 mt-0.5">Trigger: {calc.discount_pct}% discount</div>
                  </div>
                </>
              )}
            </div>
            <div className="border-t border-white/10 p-4 space-y-2">
              <Button className="w-full bg-indigo-500 hover:bg-indigo-400 text-white"><FileText className="w-4 h-4 mr-2" />Generate quote PDF</Button>
              <Button variant="outline" className="w-full border-white/10"><Mail className="w-4 h-4 mr-2" />Draft customer email</Button>
              <Button variant="outline" className="w-full border-white/10"><Target className="w-4 h-4 mr-2" />Create CRM opportunity</Button>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------- ATLAS KNOWLEDGE VIEW ----------
function KnowledgeView() {
  const [policies, setPolicies] = useState([])
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [result, setResult] = useState(null)
  const [openPolicy, setOpenPolicy] = useState(null)

  useEffect(() => { api('/policies').then(setPolicies) }, [])

  const search = async () => {
    if (!query.trim()) return
    setSearching(true); setResult(null)
    try {
      const r = await api('/knowledge/search', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ query }) })
      setResult(r)
    } finally { setSearching(false) }
  }

  const examples = [
    'Maximum discount allowed',
    'Refund policy',
    'SOC2 disclosure process',
    'Partner approval process',
    'P1 escalation matrix',
    'Net 60 payment terms approval',
  ]

  const byCategory = policies.reduce((acc, p) => { (acc[p.category] = acc[p.category] || []).push(p); return acc }, {})

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-wider"><BookOpen className="w-3 h-3" />Atlas Knowledge</div>
        <h1 className="text-2xl font-semibold mt-1.5 tracking-tight">Ask anything about internal policy.</h1>
        <p className="text-zinc-400 mt-1.5 text-sm">Replaces Confluence for your day-to-day. Every answer cites its sources.</p>
      </div>

      <div className="relative">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/15 via-violet-500/15 to-fuchsia-500/15 rounded-xl blur-xl opacity-60" />
          <form onSubmit={e => { e.preventDefault(); search() }} className="relative bg-[#0f0f12] border border-white/10 rounded-xl px-5 py-4 flex items-center gap-3 focus-within:border-indigo-500/50">
            <Search className="w-5 h-5 text-zinc-500" />
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search Atlas Knowledge..." disabled={searching} className="flex-1 bg-transparent outline-none text-base text-white placeholder:text-zinc-600" />
            {searching && <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />}
            {!searching && query && <button type="submit" className="px-3 py-1.5 rounded-md bg-indigo-500 hover:bg-indigo-400 text-white text-sm">Ask</button>}
          </form>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {examples.map(ex => (
            <button key={ex} onClick={() => { setQuery(ex); setTimeout(search, 0) }}
              className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 border border-white/5 transition">{ex}</button>
          ))}
        </div>
      </div>

      {result && (
        <Card className="bg-[#0f0f12] border-white/5 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <div className="text-xs uppercase tracking-wider text-zinc-500">Atlas answer</div>
            <ConfidencePill score={result.confidence} reasoning={result.reasoning} missing={result.missing_info} evidence={(result.sources||[]).map(s => `${s.policy.title}`)} />
          </div>
          <div className="text-[15px] text-zinc-100 leading-relaxed whitespace-pre-wrap">{result.answer}</div>
          {result.sources?.length > 0 && (
            <div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Sources</div>
              <div className="space-y-2">
                {result.sources.map((s, i) => (
                  <button key={i} onClick={() => setOpenPolicy(s.policy)} className="w-full text-left p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-white">{s.policy.title}</div>
                      <Badge variant="outline" className="border-white/10 text-zinc-400 text-[10px]">{s.policy.category}</Badge>
                      <div className="ml-auto text-xs font-mono text-emerald-300">{s.relevance}% relevance</div>
                    </div>
                    {s.excerpt && <div className="text-xs text-zinc-400 mt-1.5 italic leading-relaxed">"{s.excerpt}"</div>}
                    <div className="text-[10px] text-zinc-500 mt-1">{s.policy.owner} · updated {s.policy.last_updated}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      <div>
        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Browse policies · {policies.length}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(byCategory).map(([cat, items]) => (
            <Card key={cat} className="bg-[#0f0f12] border-white/5 p-4">
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">{cat}</div>
              <div className="space-y-1">
                {items.map(p => (
                  <button key={p.id} onClick={() => setOpenPolicy(p)} className="w-full text-left px-2 py-1.5 rounded hover:bg-white/5 text-sm text-zinc-200 transition">
                    {p.title}
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={!!openPolicy} onOpenChange={() => setOpenPolicy(null)}>
        <DialogContent className="!max-w-3xl bg-[#0c0c0e] border-white/10 text-zinc-100 max-h-[85vh] overflow-y-auto">
          {openPolicy && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <DialogTitle>{openPolicy.title}</DialogTitle>
                  <Badge variant="outline" className="border-white/10 text-zinc-400">{openPolicy.category}</Badge>
                </div>
                <div className="text-xs text-zinc-500">Owner: {openPolicy.owner} · Updated: {openPolicy.last_updated}</div>
              </DialogHeader>
              <pre className="text-sm text-zinc-200 whitespace-pre-wrap font-sans leading-relaxed mt-3">{openPolicy.body}</pre>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {(openPolicy.tags || []).map(t => <Badge key={t} variant="outline" className="border-white/10 text-zinc-500 text-[10px]">#{t}</Badge>)}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TasksView() {
  const [tasks, setTasks] = useState([])
  useEffect(() => { api('/tasks').then(setTasks) }, [])
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Tasks</h1>
      <Card className="bg-[#0f0f12] border-white/5 p-5">
        {tasks.length === 0 ? (
          <div className="text-sm text-zinc-500 py-10 text-center">
            No tasks yet. Generate a follow-up after a meeting brief to create tasks automatically.
          </div>
        ) : tasks.map(t => (
          <div key={t.id} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
            <Clock className="w-4 h-4 text-zinc-500" />
            <Logo text={t.company?.logo} size="sm" />
            <div className="flex-1">
              <div className="text-sm text-white">{t.title}</div>
              <div className="text-xs text-zinc-500">{t.company?.name} • {t.owner} • due {t.due}</div>
            </div>
            <Badge className={`${t.priority==='P1'?'bg-rose-500/20 text-rose-300':t.priority==='P2'?'bg-amber-500/20 text-amber-300':'bg-zinc-700/40 text-zinc-300'} border-0`}>{t.priority}</Badge>
          </div>
        ))}
      </Card>
    </div>
  )
}

function App() {
  const [view, setView] = useState({ name: 'workbench' })
  const [briefState, setBriefState] = useState({ open: false, company: null, meeting: null })

  const openAccount = (c) => setView({ name: 'account', companyId: c.id })
  const openBrief = (company, meeting) => setBriefState({ open: true, company, meeting })
  const closeBrief = () => setBriefState({ open: false, company: null, meeting: null })

  return (
    <div className="flex h-screen bg-[#0a0a0b]">
      <Sidebar view={view} setView={setView} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onSearch={openAccount} />
        <main className="flex-1 overflow-auto">
          {view.name === 'workbench' && <WorkbenchView openAccount={openAccount} />}
          {view.name === 'dashboard' && <DashboardView openAccount={openAccount} openBrief={openBrief} />}
          {view.name === 'accounts' && <AccountsView openAccount={openAccount} />}
          {view.name === 'account' && <AccountDetailView companyId={view.companyId} openBrief={openBrief} goBack={() => setView({ name: 'accounts' })} />}
          {view.name === 'knowledge' && <KnowledgeView />}
          {view.name === 'tasks' && <TasksView />}
        </main>
      </div>
      <BriefModal open={briefState.open} onClose={closeBrief} company={briefState.company} meeting={briefState.meeting} />
    </div>
  )
}

export default App

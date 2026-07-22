import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'

let client
let db

async function connectToMongo() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME)
  }
  return db
}

function cors(res) {
  res.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return res
}
export async function OPTIONS() { return cors(new NextResponse(null,{status:200})) }

const clean = (doc) => { if (!doc) return doc; const { _id, ...rest } = doc; return rest }
const cleanAll = (arr) => arr.map(clean)
const fmtUSD = (n) => { if (!n) return '$0'; const abs = Math.abs(n); if (abs >= 1_000_000) return `$${(n/1_000_000).toFixed(2)}M`; if (abs >= 1_000) return `$${(n/1000).toFixed(0)}k`; return `$${n.toLocaleString()}` }
const daysUntil = (iso) => Math.round((new Date(iso) - Date.now()) / 86400000)

// ---------- LLM ----------
async function callLLM({ system, user, json = true, model }) {
  const url = `${process.env.EMERGENT_LLM_BASE_URL}/chat/completions`
  const body = {
    model: model || process.env.LLM_MODEL || 'gpt-4.1',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.4,
  }
  if (json) body.response_format = { type: 'json_object' }
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.EMERGENT_LLM_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!r.ok) {
    const t = await r.text()
    throw new Error(`LLM error ${r.status}: ${t}`)
  }
  const data = await r.json()
  const content = data.choices?.[0]?.message?.content || ''
  if (json) {
    try { return JSON.parse(content) } catch { return { raw: content } }
  }
  return content
}

// ---------- SEED DATA ----------
function daysFromNow(d) { return new Date(Date.now() + d * 86400000) }
function hoursAgo(h) { return new Date(Date.now() - h * 3600000) }

function buildSeed() {
  const companies = [
    {
      id: 'co-acme', name: 'Acme Corp', industry: 'SaaS Analytics', logo: 'AC',
      arr: 240000, plan: 'Enterprise', employees: 1200, region: 'North America',
      csm: 'You', health: 87, health_label: 'Healthy', health_trend: '+4',
      renewal_date: daysFromNow(45).toISOString(), renewal_status: 'On Track',
      product_usage_summary: 'Daily active usage up 18% QoQ. Strong adoption of Dashboards and Alerts modules. Recently enabled SSO and SCIM for two new business units.',
      strategic_notes: 'Champion: Sarah Chen (VP Data). Expansion path into Marketing org identified.',
    },
    {
      id: 'co-hooli', name: 'Hooli', industry: 'Technology', logo: 'HO',
      arr: 1200000, plan: 'Enterprise Plus', employees: 9500, region: 'Global',
      csm: 'You', health: 62, health_label: 'Watch', health_trend: '-6',
      renewal_date: daysFromNow(18).toISOString(), renewal_status: 'At Risk',
      product_usage_summary: 'Seat utilization 71% (down from 84%). Two power-user teams paused workflows during recent reorg. API usage stable.',
      strategic_notes: 'New CIO Gavin Belson reviewing all vendor spend. Multi-thread to procurement and finance ASAP.',
    },
    {
      id: 'co-globex', name: 'Globex Inc', industry: 'Manufacturing', logo: 'GL',
      arr: 450000, plan: 'Business', employees: 3400, region: 'EMEA',
      csm: 'You', health: 34, health_label: 'High Risk', health_trend: '-22',
      renewal_date: daysFromNow(12).toISOString(), renewal_status: 'High Risk',
      product_usage_summary: 'Active users dropped 41% over 60 days. Critical integration to SAP failing intermittently. 3 P1 tickets open.',
      strategic_notes: 'Champion left the company (Jacques Pernod). New stakeholder unidentified. Executive sponsor escalation required.',
    },
    {
      id: 'co-initech', name: 'Initech', industry: 'Financial Services', logo: 'IN',
      arr: 180000, plan: 'Business', employees: 800, region: 'North America',
      csm: 'You', health: 91, health_label: 'Healthy', health_trend: '+2',
      renewal_date: daysFromNow(90).toISOString(), renewal_status: 'On Track',
      product_usage_summary: 'Power users across Finance team. NPS 9 from last survey. Asked about advanced compliance reporting (potential upsell).',
      strategic_notes: 'Bill Lumbergh is exec sponsor. Strong reference customer; willing to do case study.',
    },
    {
      id: 'co-umbrella', name: 'Umbrella Corp', industry: 'Pharmaceuticals', logo: 'UM',
      arr: 680000, plan: 'Enterprise', employees: 5200, region: 'Global',
      csm: 'You', health: 55, health_label: 'Watch', health_trend: '-3',
      renewal_date: daysFromNow(30).toISOString(), renewal_status: 'Watch',
      product_usage_summary: 'Compliance module under review. Security team raised SOC2 documentation request. Usage in R&D team excellent.',
      strategic_notes: 'Albert Wesker is decision maker but rarely available. CISO Ada Wong is gatekeeper for security review.',
    },
  ]

  const contacts = [
    { id: 'ct-1', company_id: 'co-acme', name: 'Sarah Chen', title: 'VP Data', email: 'sarah.chen@acme.com', role: 'Champion' },
    { id: 'ct-2', company_id: 'co-acme', name: 'Marcus Webb', title: 'Director of Analytics', email: 'marcus@acme.com', role: 'User' },
    { id: 'ct-3', company_id: 'co-hooli', name: 'Gavin Belson', title: 'CIO', email: 'gavin@hooli.com', role: 'Economic Buyer' },
    { id: 'ct-4', company_id: 'co-hooli', name: 'Jared Dunn', title: 'COO', email: 'jared@hooli.com', role: 'Champion' },
    { id: 'ct-5', company_id: 'co-hooli', name: 'Monica Hall', title: 'VP Procurement', email: 'monica@hooli.com', role: 'Procurement' },
    { id: 'ct-6', company_id: 'co-globex', name: 'Marie Laurent', title: 'Head of IT', email: 'm.laurent@globex.eu', role: 'New Stakeholder' },
    { id: 'ct-7', company_id: 'co-globex', name: 'Hans Gruber', title: 'CTO', email: 'h.gruber@globex.eu', role: 'Decision Maker' },
    { id: 'ct-8', company_id: 'co-initech', name: 'Bill Lumbergh', title: 'VP Finance', email: 'bill@initech.com', role: 'Exec Sponsor' },
    { id: 'ct-9', company_id: 'co-initech', name: 'Peter Gibbons', title: 'Senior Analyst', email: 'peter@initech.com', role: 'Power User' },
    { id: 'ct-10', company_id: 'co-umbrella', name: 'Albert Wesker', title: 'Chief Research Officer', email: 'a.wesker@umbrella.com', role: 'Decision Maker' },
    { id: 'ct-11', company_id: 'co-umbrella', name: 'Ada Wong', title: 'CISO', email: 'a.wong@umbrella.com', role: 'Security Gatekeeper' },
  ]

  const emails = [
    { id: 'em-1', company_id: 'co-acme', from: 'Sarah Chen', subject: 'Re: Q3 expansion proposal', snippet: 'This looks great. Can we get Marketing team access by mid-month? We want to pilot dashboards with them.', sentiment: 'positive', timestamp: hoursAgo(20).toISOString() },
    { id: 'em-2', company_id: 'co-acme', from: 'Marcus Webb', subject: 'Alert config question', snippet: 'How do I configure thresholds for the new revenue alert? Our previous setup did not migrate cleanly.', sentiment: 'neutral', timestamp: hoursAgo(46).toISOString() },
    { id: 'em-3', company_id: 'co-acme', from: 'Sarah Chen', subject: 'Thanks for the demo', snippet: 'The team loved the workflow automation walkthrough. Sending you our use cases by Friday.', sentiment: 'positive', timestamp: hoursAgo(72).toISOString() },

    { id: 'em-4', company_id: 'co-hooli', from: 'Gavin Belson', subject: 'Vendor consolidation review', snippet: 'As part of our vendor consolidation, I need full ROI breakdown by EOW. Schedule with my EA.', sentiment: 'tense', timestamp: hoursAgo(8).toISOString() },
    { id: 'em-5', company_id: 'co-hooli', from: 'Monica Hall', subject: 'Procurement docs needed', snippet: 'Need updated MSA, SOC2, and pricing tiers. We are reviewing 9 vendors this quarter.', sentiment: 'neutral', timestamp: hoursAgo(28).toISOString() },
    { id: 'em-6', company_id: 'co-hooli', from: 'Jared Dunn', subject: 'Re: workflow paused', snippet: 'Yes we paused the data ops workflow during the reorg. Should resume in 2 weeks once new team is staffed.', sentiment: 'neutral', timestamp: hoursAgo(50).toISOString() },

    { id: 'em-7', company_id: 'co-globex', from: 'Marie Laurent', subject: 'SAP integration broken AGAIN', snippet: 'This is the 3rd outage this month. We cannot run month-end close. Need escalation.', sentiment: 'angry', timestamp: hoursAgo(4).toISOString() },
    { id: 'em-8', company_id: 'co-globex', from: 'Hans Gruber', subject: 'Renewal conversation', snippet: 'Before we discuss renewal, I need to see a remediation plan for the SAP issues. We are evaluating alternatives.', sentiment: 'negative', timestamp: hoursAgo(30).toISOString() },
    { id: 'em-9', company_id: 'co-globex', from: 'Marie Laurent', subject: 'Jacques transition', snippet: 'FYI Jacques left last week. I am now your primary contact but I am still ramping up.', sentiment: 'neutral', timestamp: hoursAgo(120).toISOString() },

    { id: 'em-10', company_id: 'co-initech', from: 'Bill Lumbergh', subject: 'Reference call - yeahhh', snippet: 'Yeah, if you could go ahead and use us as a reference for the financial vertical, that would be greatttt.', sentiment: 'positive', timestamp: hoursAgo(36).toISOString() },
    { id: 'em-11', company_id: 'co-initech', from: 'Peter Gibbons', subject: 'Compliance reporting feature', snippet: 'Loving the new module. Quick q: does it cover SOX 404 attestation workflows?', sentiment: 'positive', timestamp: hoursAgo(60).toISOString() },

    { id: 'em-12', company_id: 'co-umbrella', from: 'Ada Wong', subject: 'SOC2 Type II report', snippet: 'Please send the latest SOC2 Type II report and your subprocessor list. Required before we sign renewal.', sentiment: 'neutral', timestamp: hoursAgo(12).toISOString() },
    { id: 'em-13', company_id: 'co-umbrella', from: 'Albert Wesker', subject: 'R&D expansion', snippet: 'My R&D team wants to expand seats from 40 to 75. Send updated quote.', sentiment: 'positive', timestamp: hoursAgo(54).toISOString() },
  ]

  const tickets = [
    { id: 'tk-1', company_id: 'co-acme', subject: 'Alert thresholds not migrating', priority: 'P3', status: 'Open', opened: hoursAgo(46).toISOString() },
    { id: 'tk-2', company_id: 'co-hooli', subject: 'SSO claim mapping for new IdP', priority: 'P2', status: 'Open', opened: hoursAgo(40).toISOString() },
    { id: 'tk-3', company_id: 'co-hooli', subject: 'API rate limit increase', priority: 'P3', status: 'Resolved', opened: hoursAgo(96).toISOString() },
    { id: 'tk-4', company_id: 'co-globex', subject: 'SAP integration timeout (CRITICAL)', priority: 'P1', status: 'Open', opened: hoursAgo(6).toISOString() },
    { id: 'tk-5', company_id: 'co-globex', subject: 'Data export failing for FR region', priority: 'P1', status: 'Open', opened: hoursAgo(38).toISOString() },
    { id: 'tk-6', company_id: 'co-globex', subject: 'Bulk user provisioning broken', priority: 'P2', status: 'Open', opened: hoursAgo(72).toISOString() },
    { id: 'tk-7', company_id: 'co-initech', subject: 'Feature request: SOX attestation', priority: 'P4', status: 'Triaged', opened: hoursAgo(60).toISOString() },
    { id: 'tk-8', company_id: 'co-umbrella', subject: 'SOC2 doc request', priority: 'P3', status: 'In Progress', opened: hoursAgo(12).toISOString() },
    { id: 'tk-9', company_id: 'co-umbrella', subject: 'GxP validation evidence', priority: 'P2', status: 'In Progress', opened: hoursAgo(72).toISOString() },
  ]

  const notes = [
    { id: 'nt-1', company_id: 'co-acme', author: 'You', body: 'Sarah confirmed expansion into Marketing. Aiming for $80k uplift at renewal.', timestamp: hoursAgo(96).toISOString() },
    { id: 'nt-2', company_id: 'co-hooli', author: 'You', body: 'Gavin replaced previous CIO 6 weeks ago. He is skeptical of all current vendors. Jared is our last warm contact.', timestamp: hoursAgo(140).toISOString() },
    { id: 'nt-3', company_id: 'co-globex', author: 'You', body: 'Champion (Jacques) departed. Need to identify new champion fast. Marie is friendly but not influential.', timestamp: hoursAgo(110).toISOString() },
    { id: 'nt-4', company_id: 'co-initech', author: 'You', body: 'Excellent fit. Bill agreed to reference call. Filed case study request with marketing.', timestamp: hoursAgo(70).toISOString() },
    { id: 'nt-5', company_id: 'co-umbrella', author: 'You', body: 'Ada is meticulous on security. Once she signs off, Wesker will move quickly on the expansion.', timestamp: hoursAgo(80).toISOString() },
  ]

  const today = new Date()
  today.setHours(10, 0, 0, 0)
  const meetings = [
    { id: 'mt-1', company_id: 'co-hooli', title: 'Hooli — Renewal kickoff with Gavin', attendees: ['Gavin Belson', 'Jared Dunn', 'You'], scheduled_at: new Date(today.getTime() + 2*3600000).toISOString(), duration_min: 45, type: 'Renewal', location: 'Zoom' },
    { id: 'mt-2', company_id: 'co-globex', title: 'Globex — Escalation review', attendees: ['Hans Gruber', 'Marie Laurent', 'You', 'VP CS'], scheduled_at: new Date(today.getTime() + 5*3600000).toISOString(), duration_min: 30, type: 'Escalation', location: 'Google Meet' },
    { id: 'mt-3', company_id: 'co-acme', title: 'Acme — Q3 expansion working session', attendees: ['Sarah Chen', 'Marcus Webb', 'You'], scheduled_at: new Date(today.getTime() + 24*3600000).toISOString(), duration_min: 60, type: 'Expansion', location: 'Zoom' },
    { id: 'mt-4', company_id: 'co-umbrella', title: 'Umbrella — Security review with Ada', attendees: ['Ada Wong', 'You'], scheduled_at: new Date(today.getTime() + 26*3600000).toISOString(), duration_min: 30, type: 'Security', location: 'Zoom' },
    { id: 'mt-5', company_id: 'co-initech', title: 'Initech — Quarterly business review', attendees: ['Bill Lumbergh', 'Peter Gibbons', 'You'], scheduled_at: new Date(today.getTime() + 50*3600000).toISOString(), duration_min: 60, type: 'QBR', location: 'Zoom' },
  ]

  return { companies, contacts, emails, tickets, notes, meetings }
}

async function seedDatabase() {
  const db = await connectToMongo()
  const data = buildSeed()
  await Promise.all([
    db.collection('companies').deleteMany({}),
    db.collection('contacts').deleteMany({}),
    db.collection('emails').deleteMany({}),
    db.collection('tickets').deleteMany({}),
    db.collection('notes').deleteMany({}),
    db.collection('meetings').deleteMany({}),
    db.collection('briefs').deleteMany({}),
    db.collection('tasks').deleteMany({}),
    db.collection('followups').deleteMany({}),
    db.collection('invoices').deleteMany({}),
    db.collection('policies').deleteMany({}),
    db.collection('products').deleteMany({}),
    db.collection('quotes').deleteMany({}),
    db.collection('workbench_cards').deleteMany({}),
  ])
  await Promise.all([
    db.collection('companies').insertMany(data.companies),
    db.collection('contacts').insertMany(data.contacts),
    db.collection('emails').insertMany(data.emails),
    db.collection('tickets').insertMany(data.tickets),
    db.collection('notes').insertMany(data.notes),
    db.collection('meetings').insertMany(data.meetings),
  ])
  await applyEnrichments()
  return { ok: true, counts: Object.fromEntries(Object.entries(data).map(([k,v])=>[k,v.length])) }
}

// ---------- ENRICHED COMMERCIAL / ADOPTION DATA ----------
function genTrend(baseline, variance, length = 30) {
  const arr = []
  let v = baseline
  for (let i = length; i >= 0; i--) {
    v = Math.max(0, Math.round(baseline + (Math.sin(i/3) + Math.random()-0.5) * variance))
    const d = new Date(Date.now() - i*86400000)
    arr.push({ date: d.toISOString().slice(0,10), dau: v })
  }
  return arr
}

function buildEnrichments() {
  return {
    'co-acme': {
      mrr: 20000, list_price: 264000, discount: 9, net_price: 240000,
      billing_frequency: 'Annual', payment_terms: 'Net 30',
      contract_start: '2023-08-15', last_renewal_date: '2025-08-15', customer_since: '2021-08-15',
      contract_pdf_url: '/contracts/acme-msa-2025.pdf',
      partner: null, partner_margin: 0, outstanding_balance: 0,
      champion: 'Sarah Chen — VP Data',
      exec_sponsor: 'James Whitfield — Chief Data Officer',
      decision_makers: ['Sarah Chen (VP Data)', 'James Whitfield (CDO)', 'Lisa Park (VP Finance)'],
      primary_risk: 'Marketing pilot must succeed by Aug 15 to lock the $80k expansion',
      current_opportunity: 'Marketing dept expansion (+$80k ARR, verbal commit from Sarah)',
      atlas_executive_summary: 'Acme is a healthy, expanding account. Strong champion. Verbal commitment for Marketing expansion at renewal. Watch the SSO alert-config issue (P3). Plan: launch Marketing pilot by Jul 15 to lock the upsell.',
      atlas_confidence: 92,
      purchased_products: ['Analytics Core','Workflow Automation','SSO/SCIM'],
      seats_purchased: 200, seats_used: 176,
      dau: 142, wau: 188, mau: 196,
      feature_adoption: [
        { feature: 'Dashboards', adoption: 96, trend: '+4' },
        { feature: 'Alerts', adoption: 78, trend: '+11' },
        { feature: 'Workflows', adoption: 64, trend: '+22' },
        { feature: 'API', adoption: 51, trend: '+3' },
        { feature: 'Mobile', adoption: 34, trend: '-2' },
        { feature: 'AI Insights', adoption: 28, trend: '+28' },
      ],
      api_usage_monthly: 4_240_000, storage_used_gb: 142, storage_total_gb: 500,
      last_login: hoursAgo(2).toISOString(),
      power_users: ['Sarah Chen','Marcus Webb','Priya Singh','David Liu'],
      inactive_users: ['John Smith','Emily Tran'],
      adoption_trend: genTrend(142, 18),
    },
    'co-hooli': {
      mrr: 100000, list_price: 1380000, discount: 13, net_price: 1200000,
      billing_frequency: 'Annual', payment_terms: 'Net 45',
      contract_start: '2020-07-16', last_renewal_date: '2025-07-16', customer_since: '2020-07-16',
      contract_pdf_url: '/contracts/hooli-enterprise-plus-2025.pdf',
      partner: 'Pied Piper Solutions', partner_margin: 8, outstanding_balance: 0,
      champion: 'Jared Dunn — COO',
      exec_sponsor: '⚠ NEW CIO Gavin Belson — relationship cold',
      decision_makers: ['Gavin Belson (CIO)','Jared Dunn (COO)','Monica Hall (VP Procurement)'],
      primary_risk: 'New CIO actively consolidating vendors; demands ROI by EOW',
      current_opportunity: 'If we land the ROI deck, retain $1.2M and unlock $300k for Marketing org',
      atlas_executive_summary: 'Hooli is at high risk. New CIO Gavin Belson is reviewing all vendor spend; champion (Jared) is one level below. Seat utilization dropped from 84% to 71% after reorg. Must multi-thread: ROI to Gavin, MSA/SOC2 to Monica, technical case to Jared.',
      atlas_confidence: 78,
      purchased_products: ['Analytics Core','Workflow Automation','AI Agents','Premium Support'],
      seats_purchased: 850, seats_used: 604,
      dau: 412, wau: 588, mau: 718,
      feature_adoption: [
        { feature: 'Dashboards', adoption: 89, trend: '-3' },
        { feature: 'Workflows', adoption: 54, trend: '-18' },
        { feature: 'AI Agents', adoption: 41, trend: '+12' },
        { feature: 'API', adoption: 72, trend: '+1' },
        { feature: 'Alerts', adoption: 48, trend: '-9' },
        { feature: 'Mobile', adoption: 22, trend: '-4' },
      ],
      api_usage_monthly: 38_200_000, storage_used_gb: 2840, storage_total_gb: 5000,
      last_login: hoursAgo(4).toISOString(),
      power_users: ['Jared Dunn','Big Head','Dinesh Chugtai','Gilfoyle'],
      inactive_users: ['Pat Lee','Erlich Bachman','Russ Hanneman'],
      adoption_trend: genTrend(412, 60),
    },
    'co-globex': {
      mrr: 37500, list_price: 528000, discount: 15, net_price: 450000,
      billing_frequency: 'Annual', payment_terms: 'Net 60',
      contract_start: '2022-07-10', last_renewal_date: '2024-07-10', customer_since: '2022-07-10',
      contract_pdf_url: '/contracts/globex-business-2024.pdf',
      partner: null, partner_margin: 0, outstanding_balance: 18750,
      champion: '⚠ Departed — Jacques Pernod (left 2 weeks ago)',
      exec_sponsor: 'Hans Gruber — CTO (skeptical)',
      decision_makers: ['Hans Gruber (CTO)','Marie Laurent (Head of IT, new)','Walter Eckhardt (CFO)'],
      primary_risk: '3 open P1 tickets blocking month-end close; CTO evaluating alternatives',
      current_opportunity: 'Remediation plan + executive sponsorship could retain $450k',
      atlas_executive_summary: 'CRITICAL. Globex is days from churn. Champion departed. Hans Gruber demands remediation plan before renewal. SAP integration P1 unresolved for 6 days. Outstanding $18.75k invoice 12 days overdue. Action: ship written remediation plan today; escalate engineering to fix SAP integration this week.',
      atlas_confidence: 64,
      purchased_products: ['Analytics Core','SAP Integration','Standard Support'],
      seats_purchased: 180, seats_used: 76,
      dau: 38, wau: 64, mau: 102,
      feature_adoption: [
        { feature: 'Dashboards', adoption: 42, trend: '-28' },
        { feature: 'SAP Sync', adoption: 18, trend: '-44' },
        { feature: 'Workflows', adoption: 22, trend: '-12' },
        { feature: 'Alerts', adoption: 19, trend: '-15' },
        { feature: 'API', adoption: 8, trend: '-22' },
        { feature: 'Mobile', adoption: 4, trend: '-6' },
      ],
      api_usage_monthly: 380_000, storage_used_gb: 42, storage_total_gb: 250,
      last_login: hoursAgo(22).toISOString(),
      power_users: ['Marie Laurent'],
      inactive_users: ['Klaus Mueller','Sophie Bernard','Pierre Dupont','Jean-Luc Vidal','Anna Ricci'],
      adoption_trend: genTrend(38, 30),
    },
    'co-initech': {
      mrr: 15000, list_price: 192000, discount: 6, net_price: 180000,
      billing_frequency: 'Annual', payment_terms: 'Net 30',
      contract_start: '2022-09-01', last_renewal_date: '2024-09-01', customer_since: '2019-09-01',
      contract_pdf_url: '/contracts/initech-business-2024.pdf',
      partner: null, partner_margin: 0, outstanding_balance: 0,
      champion: 'Bill Lumbergh — VP Finance',
      exec_sponsor: 'Michael Bolton — CFO',
      decision_makers: ['Bill Lumbergh (VP Finance)','Michael Bolton (CFO)','Samir Nagheenanajar (Controller)'],
      primary_risk: 'Low — strong adoption, exec sponsor engaged',
      current_opportunity: 'SOX 404 attestation upsell ($12k ARR) + reference customer for FinServ vertical',
      atlas_executive_summary: 'Best-in-class healthy account. NPS 9. Exec sponsor agreed to reference call. Peter Gibbons asked about SOX 404 module (uplift +$12k). Recommend: file reference case study, send SOX upsell quote.',
      atlas_confidence: 96,
      purchased_products: ['Analytics Core','Compliance Reporting','Standard Support'],
      seats_purchased: 60, seats_used: 58,
      dau: 51, wau: 56, mau: 58,
      feature_adoption: [
        { feature: 'Dashboards', adoption: 100, trend: '0' },
        { feature: 'Compliance', adoption: 94, trend: '+12' },
        { feature: 'Workflows', adoption: 81, trend: '+4' },
        { feature: 'Alerts', adoption: 76, trend: '+2' },
        { feature: 'API', adoption: 62, trend: '+8' },
        { feature: 'Mobile', adoption: 48, trend: '+11' },
      ],
      api_usage_monthly: 1_120_000, storage_used_gb: 38, storage_total_gb: 100,
      last_login: hoursAgo(1).toISOString(),
      power_users: ['Bill Lumbergh','Peter Gibbons','Samir Nagheenanajar','Michael Bolton'],
      inactive_users: [],
      adoption_trend: genTrend(51, 6),
    },
    'co-umbrella': {
      mrr: 56666, list_price: 798000, discount: 15, net_price: 680000,
      billing_frequency: 'Annual', payment_terms: 'Net 45',
      contract_start: '2021-07-28', last_renewal_date: '2024-07-28', customer_since: '2018-07-28',
      contract_pdf_url: '/contracts/umbrella-enterprise-2024.pdf',
      partner: 'Tyrell Consulting', partner_margin: 12, outstanding_balance: 0,
      champion: 'Albert Wesker — Chief Research Officer',
      exec_sponsor: 'Albert Wesker — CRO (decision maker, busy)',
      decision_makers: ['Albert Wesker (CRO)','Ada Wong (CISO)','Leon Kennedy (VP Operations)'],
      primary_risk: 'CISO Ada Wong gating renewal on SOC2 Type II + subprocessor list',
      current_opportunity: 'R&D expansion 40→75 seats (+$35k ARR) pending security signoff',
      atlas_executive_summary: 'Umbrella is in a critical 14-day window. CISO Ada Wong gating renewal on security docs (SOC2 Type II, subprocessor list, GxP validation). Wesker has verbally committed to 35-seat R&D expansion contingent on signoff. Plan: ship security pack today, schedule Ada review for Jun 29.',
      atlas_confidence: 84,
      purchased_products: ['Analytics Core','Compliance Reporting','GxP Validation','Premium Support','AI Agents'],
      seats_purchased: 220, seats_used: 158,
      dau: 124, wau: 184, mau: 212,
      feature_adoption: [
        { feature: 'Dashboards', adoption: 88, trend: '+2' },
        { feature: 'Compliance', adoption: 92, trend: '+6' },
        { feature: 'GxP', adoption: 71, trend: '+18' },
        { feature: 'AI Agents', adoption: 56, trend: '+22' },
        { feature: 'API', adoption: 64, trend: '+8' },
        { feature: 'Mobile', adoption: 19, trend: '+3' },
      ],
      api_usage_monthly: 8_400_000, storage_used_gb: 1240, storage_total_gb: 2000,
      last_login: hoursAgo(6).toISOString(),
      power_users: ['Albert Wesker','Ada Wong','Leon Kennedy','Claire Redfield'],
      inactive_users: ['Jill Valentine','Chris Redfield'],
      adoption_trend: genTrend(124, 22),
    },
  }
}

function buildInvoices() {
  const list = []
  const cfg = [
    { id:'co-acme', amt: 20000, count: 12, freq: 'monthly', start: 12 },
    { id:'co-hooli', amt: 300000, count: 4, freq: 'quarterly', start: 12 },
    { id:'co-globex', amt: 112500, count: 8, freq: 'quarterly', start: 24, lastOverdue: true },
    { id:'co-initech', amt: 45000, count: 4, freq: 'quarterly', start: 12 },
    { id:'co-umbrella', amt: 170000, count: 4, freq: 'quarterly', start: 12 },
  ]
  cfg.forEach(c => {
    for (let i=0;i<c.count;i++) {
      const monthsAgo = c.start - i * (c.freq === 'monthly' ? 1 : 3)
      if (monthsAgo < -1) continue
      const d = new Date(); d.setMonth(d.getMonth() - monthsAgo)
      const isFuture = monthsAgo < 0
      const isOverdue = c.lastOverdue && i === c.count - 1
      const status = isFuture ? 'scheduled' : isOverdue ? 'overdue' : 'paid'
      list.push({
        id: uuidv4(),
        company_id: c.id,
        number: `INV-${(2024 + Math.floor((c.count-i)/12)).toString().slice(-2)}-${(1000 + i*7 + c.id.length).toString()}`,
        date: d.toISOString().slice(0,10),
        due_date: new Date(d.getTime() + 30*86400000).toISOString().slice(0,10),
        amount: c.amt,
        status,
        period: c.freq === 'monthly' ? d.toLocaleDateString('en-US',{month:'short',year:'numeric'}) : `Q${Math.floor(d.getMonth()/3)+1} ${d.getFullYear()}`,
        description: c.freq === 'monthly' ? 'Monthly subscription' : 'Quarterly subscription',
      })
    }
  })
  return list
}

function buildProducts() {
  return [
    { id: 'p-core', name: 'Analytics Core', price_per_seat: 100, monthly_per_seat: 9, tier: 'Business' },
    { id: 'p-enterprise', name: 'Analytics Enterprise', price_per_seat: 180, monthly_per_seat: 18, tier: 'Enterprise' },
    { id: 'p-enterprise-plus', name: 'Analytics Enterprise Plus', price_per_seat: 300, monthly_per_seat: 28, tier: 'Enterprise Plus' },
    { id: 'p-workflow', name: 'Workflow Automation', price_per_seat: 40, monthly_per_seat: 4, tier: 'Add-on' },
    { id: 'p-ai-agents', name: 'AI Agents', price_per_seat: 80, monthly_per_seat: 8, tier: 'Add-on' },
    { id: 'p-compliance', name: 'Compliance Reporting', price_per_seat: 60, monthly_per_seat: 6, tier: 'Add-on' },
    { id: 'p-gxp', name: 'GxP Validation', price_per_seat: 90, monthly_per_seat: 9, tier: 'Add-on' },
    { id: 'p-sso', name: 'SSO/SCIM', price_per_seat: 0, monthly_per_seat: 0, flat_annual: 24000, tier: 'Add-on' },
    { id: 'p-premium-support', name: 'Premium Support', price_per_seat: 0, monthly_per_seat: 0, flat_annual: 48000, tier: 'Support' },
  ]
}

function buildPolicies() {
  const today = new Date().toISOString().slice(0,10)
  return [
    { id: 'pol-discount', category: 'Commercial', title: 'Discount Authorization Matrix', owner: 'Finance · Lisa Park', last_updated: today, tags: ['discount','approval','pricing'],
      body: `# Discount Authorization Matrix\n\nMaximum allowable discount by approver:\n\n- Up to **15%** — CSM auto-approve\n- **15.01% – 25%** — VP Customer Success approval\n- **25.01% – 40%** — CFO approval\n- **40.01% +** — Executive Committee (CEO + CFO)\n\nMulti-year deals: add an extra 5% headroom at each tier.\n\nExceptions: must be filed via deal-desk@atlas.com with revenue justification.\n\nLast reviewed: ${today}` },
    { id: 'pol-refund', category: 'Commercial', title: 'Refund Policy', owner: 'Finance · Lisa Park', last_updated: today, tags: ['refund','credit','billing'],
      body: `# Refund & Credit Policy\n\n- Pro-rated refunds available within 30 days of invoice for service-level breaches.\n- Annual prepayments are non-refundable; credit notes are the standard remediation.\n- Credit notes >$25k require CFO approval.\n- Refunds beyond 30 days require executive approval and a written remediation report.` },
    { id: 'pol-soc2', category: 'Security', title: 'SOC2 Type II Disclosure', owner: 'Security · CISO Office', last_updated: today, tags: ['soc2','security','compliance'],
      body: `# SOC2 Type II Disclosure\n\nAtlas maintains a current SOC2 Type II report covering Security, Availability, and Confidentiality.\n\nDisclosure process:\n1. Customer signs MNDA (template: legal/mnda.pdf)\n2. Send the latest report + subprocessor list from security-portal.atlas.com\n3. Walk through findings during a 30-min call\n\nReport refresh cadence: every 12 months.` },
    { id: 'pol-escalation', category: 'Support', title: 'Customer Escalation Matrix', owner: 'Support · VP Support', last_updated: today, tags: ['escalation','support','p1'],
      body: `# Customer Escalation Matrix\n\nP1 (production down):\n- Page on-call SRE within 15 min\n- VP Support paged at 30 min unresolved\n- Executive sponsor (CRO) at 60 min unresolved\n\nP2 (major impact, workaround exists):\n- Resolve within 4 business hours\n- Daily status update to champion\n\nP3 (minor): 2 business days SLA\nP4 (cosmetic/feature): triage weekly` },
    { id: 'pol-partner', category: 'Commercial', title: 'Partner Approval Process', owner: 'Partnerships · Director', last_updated: today, tags: ['partner','channel','margin'],
      body: `# Partner / Channel Approval\n\nStandard partner margins:\n- Reseller: 12%\n- Referral: 8%\n- Strategic SI: up to 20% with director approval\n\nAll partner-led deals must be registered in deal-registration.atlas.com 30 days before close. Channel conflict reviewed weekly.` },
    { id: 'pol-finance-approval', category: 'Commercial', title: 'Finance Approval Thresholds', owner: 'Finance · CFO Office', last_updated: today, tags: ['approval','finance','contract'],
      body: `# Finance Approval Thresholds\n\nNon-standard terms requiring Finance signoff:\n- Net 60+ payment terms\n- Multi-year deals > $250k ACV\n- Custom indemnification\n- Revenue-share arrangements\n- Termination for convenience clauses\n\nTurnaround: 24h for standard, 72h for complex.` },
    { id: 'pol-security-q', category: 'Security', title: 'Security Questionnaire Response', owner: 'Security · CISO Office', last_updated: today, tags: ['security','questionnaire','sig'],
      body: `# Security Questionnaire Response Process\n\nStandard turnaround: 5 business days for SIG, CAIQ, or vendor-specific.\n\nMost-requested artifacts (pre-approved):\n- SOC2 Type II report\n- Penetration test summary (annual)\n- Subprocessor list\n- Data residency map\n- Encryption at rest/transit details\n- BCP/DR runbook` },
    { id: 'pol-billing', category: 'Commercial', title: 'Billing Frequency & Terms', owner: 'Finance · Lisa Park', last_updated: today, tags: ['billing','invoicing','terms'],
      body: `# Billing Frequency & Payment Terms\n\nStandard: Annual prepay, Net 30.\nAvailable on request: Quarterly (Net 30), Monthly for SMB.\n\nNet 45 / Net 60 require Finance approval. Net 90+ requires CFO approval and 2% surcharge.\n\nLate fees: 1.5%/mo on outstanding balances >30 days.` },
    { id: 'pol-renewal', category: 'Commercial', title: 'Renewal Playbook', owner: 'Customer Success · VP CS', last_updated: today, tags: ['renewal','playbook','expansion'],
      body: `# Renewal Playbook\n\nT-120 days: open renewal opportunity in Salesforce\nT-90: champion & exec sponsor alignment call\nT-60: send renewal proposal with expansion path\nT-30: redline negotiations, finance approval if needed\nT-14: signature pursuit\nT-0: countersign + handoff to billing` },
    { id: 'pol-gxp', category: 'Security', title: 'GxP Validation Evidence', owner: 'Security · Compliance Lead', last_updated: today, tags: ['gxp','pharma','validation'],
      body: `# GxP Validation Evidence\n\nFor regulated pharma customers (e.g. Umbrella, Pfizer):\n- IQ/OQ/PQ documents are stored in compliance-portal.atlas.com\n- 21 CFR Part 11 e-signature evidence available on request\n- Change control summary refreshed quarterly` },
    { id: 'pol-data-residency', category: 'Security', title: 'Data Residency', owner: 'Security · CISO Office', last_updated: today, tags: ['data','residency','eu','gdpr'],
      body: `# Data Residency Options\n\nAvailable regions: US-East, US-West, EU (Frankfurt), UK, APAC (Singapore), Australia.\n\nEU customers default to Frankfurt (GDPR Schrems II compliant). Cross-region replication available on Enterprise Plus.` },
    { id: 'pol-ai-usage', category: 'Product', title: 'AI Agents Acceptable Use', owner: 'Product · AI Lead', last_updated: today, tags: ['ai','agents','policy'],
      body: `# AI Agents Acceptable Use Policy\n\nAtlas AI Agents process customer data under the standard DPA. Data is never used for model training.\n\nProhibited uses: automated decisions affecting individuals' legal rights, PII enrichment from public sources, real-time biometric inference.` },
  ]
}

async function applyEnrichments() {
  const db = await connectToMongo()
  const enr = buildEnrichments()
  for (const [id, fields] of Object.entries(enr)) {
    await db.collection('companies').updateOne({ id }, { $set: fields })
  }
  await db.collection('invoices').insertMany(buildInvoices())
  await db.collection('policies').insertMany(buildPolicies())
  await db.collection('products').insertMany(buildProducts())
}

async function ensureSeeded() {
  const db = await connectToMongo()
  const c = await db.collection('companies').countDocuments()
  if (c === 0) await seedDatabase()
}

// ---------- AGGREGATIONS ----------
async function getCompanyContext(companyId) {
  const db = await connectToMongo()
  const [company, contacts, emails, tickets, notes, meetings] = await Promise.all([
    db.collection('companies').findOne({ id: companyId }),
    db.collection('contacts').find({ company_id: companyId }).toArray(),
    db.collection('emails').find({ company_id: companyId }).sort({ timestamp: -1 }).toArray(),
    db.collection('tickets').find({ company_id: companyId }).sort({ opened: -1 }).toArray(),
    db.collection('notes').find({ company_id: companyId }).sort({ timestamp: -1 }).toArray(),
    db.collection('meetings').find({ company_id: companyId }).sort({ scheduled_at: 1 }).toArray(),
  ])
  return {
    company: clean(company),
    contacts: cleanAll(contacts),
    emails: cleanAll(emails),
    tickets: cleanAll(tickets),
    notes: cleanAll(notes),
    meetings: cleanAll(meetings),
  }
}

function buildTimeline(ctx) {
  const items = []
  ctx.emails.forEach(e => items.push({ type: 'email', id: e.id, title: `Email from ${e.from}: ${e.subject}`, detail: e.snippet, meta: e.sentiment, at: e.timestamp }))
  ctx.tickets.forEach(t => items.push({ type: 'ticket', id: t.id, title: `${t.priority} ticket — ${t.subject}`, detail: `Status: ${t.status}`, meta: t.priority, at: t.opened }))
  ctx.notes.forEach(n => items.push({ type: 'note', id: n.id, title: `Note by ${n.author}`, detail: n.body, meta: 'note', at: n.timestamp }))
  ctx.meetings.forEach(m => items.push({ type: 'meeting', id: m.id, title: m.title, detail: `${m.type} • ${m.duration_min}m • ${m.location}`, meta: m.type, at: m.scheduled_at }))
  return items.sort((a,b) => new Date(b.at) - new Date(a.at))
}

// ---------- ROUTES ----------
async function handleRoute(request, { params }) {
  const { path = [] } = await params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const db = await connectToMongo()

    if (route === '/' || route === '/root') {
      return cors(NextResponse.json({ message: 'Atlas API', version: '0.1' }))
    }

    if (route === '/seed' && method === 'POST') {
      const result = await seedDatabase()
      return cors(NextResponse.json(result))
    }

    // ---------- EXECUTIVE DASHBOARD V2 ----------
    if (route === '/dashboard/v2' && method === 'GET') {
      await ensureSeeded()
      const companies = cleanAll(await db.collection('companies').find({}).toArray())
      const invoices = cleanAll(await db.collection('invoices').find({}).toArray())
      const tickets = cleanAll(await db.collection('tickets').find({}).toArray())

      const sum = (arr, f) => arr.reduce((a, b) => a + (f(b) || 0), 0)
      const avg = (arr, f) => arr.length ? Math.round(sum(arr, f) / arr.length) : 0
      const managed_arr = sum(companies, c => c.arr)
      const managed_mrr = sum(companies, c => c.mrr)
      const portfolio_health = avg(companies, c => c.health)

      // 12-month revenue timeseries (plausible mock built from current ARR with growth)
      const months = []
      const now = new Date()
      const baseArr = managed_arr * 0.78
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const t = (11 - i) / 11
        const arr = Math.round(baseArr * (1 + t * 0.28) + (Math.sin(i)*15000))
        const expansion = Math.round(arr * 0.024 + Math.random()*5000)
        const churn = Math.round(arr * 0.011 + Math.random()*3000)
        const contraction = Math.round(arr * 0.007 + Math.random()*2000)
        const renewal_rev = Math.round(arr * 0.082)
        months.push({
          month: d.toLocaleDateString('en-US',{month:'short'}),
          full: d.toISOString().slice(0,7),
          arr, mrr: Math.round(arr/12), expansion, churn, contraction, renewal_rev,
        })
      }

      // GRR / NRR (last 12 months)
      const start_arr = months[0].arr
      const churn_total = sum(months, m => m.churn)
      const contraction_total = sum(months, m => m.contraction)
      const expansion_total = sum(months, m => m.expansion)
      const grr = Math.round(((start_arr - churn_total - contraction_total) / start_arr) * 1000) / 10
      const nrr = Math.round(((start_arr - churn_total - contraction_total + expansion_total) / start_arr) * 1000) / 10

      // Quarter progress
      const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth()/3)*3, 1)
      const qEnd = new Date(now.getFullYear(), Math.floor(now.getMonth()/3)*3 + 3, 0)
      const quarter_progress = Math.round(((now - qStart) / (qEnd - qStart)) * 100)

      // Expansion attainment vs quarterly goal
      const expansion_goal = 1_200_000
      const expansion_current = Math.round(expansion_total / 4) // proxy
      const expansion_attainment = Math.round((expansion_current / expansion_goal) * 100)

      // Renewal forecast — companies renewing in this quarter
      const renewing_q = companies.filter(c => {
        const r = new Date(c.renewal_date); return r >= qStart && r <= qEnd
      })
      const renewal_q_arr = sum(renewing_q, c => c.arr)
      const renewal_confidence = Math.round(avg(renewing_q.length ? renewing_q : companies, c => c.atlas_confidence || 80))

      // Atlas outlook
      const outlook = portfolio_health >= 75 ? 'On Track' : portfolio_health >= 60 ? 'Watch' : 'At Risk'

      // Last month trend deltas (simulate)
      const trend = (delta) => ({ delta, sign: delta >= 0 ? '+' : '' })

      const kpis = [
        { id:'arr', label:'Managed ARR', value: managed_arr, fmt:'money', trend: 4.2, hint:'Sum of net annual recurring revenue across all managed accounts.' },
        { id:'mrr', label:'Managed MRR', value: managed_mrr, fmt:'money', trend: 3.6, hint:'Monthly recurring revenue normalized from contracts.' },
        { id:'health', label:'Portfolio Health', value: portfolio_health, fmt:'score', trend: -2.1, hint:'Average health score across portfolio.' },
        { id:'grr', label:'Gross Revenue Retention', value: grr, fmt:'pct', trend: 0.4, hint:'Trailing 12m: (start − churn − contraction) / start.' },
        { id:'nrr', label:'Net Revenue Retention', value: nrr, fmt:'pct', trend: 1.8, hint:'GRR + expansion. >100% = portfolio growing.' },
        { id:'qprog', label:'Quarter Progress', value: quarter_progress, fmt:'pct', trend: null, hint:`${quarter_progress}% through ${qStart.toLocaleDateString('en-US',{month:'short'})}–${qEnd.toLocaleDateString('en-US',{month:'short'})}.` },
        { id:'exp', label:'Expansion Attainment', value: expansion_attainment, fmt:'pct', trend: -11, hint:`${fmtUSD(expansion_current)} of ${fmtUSD(expansion_goal)} quarterly goal.` },
        { id:'renf', label:'Renewal Forecast', value: renewal_confidence, fmt:'pct', trend: 0.9, hint:`${renewing_q.length} renewals (${fmtUSD(renewal_q_arr)}) this quarter, weighted by Atlas confidence.` },
        { id:'outlook', label:'Atlas Outlook', value: outlook, fmt:'text', trend: null, hint:'Composite of health, renewal pacing and pipeline confidence.' },
      ]

      // Portfolio Health buckets
      const buckets = {
        healthy: companies.filter(c => c.health >= 80),
        needs_attention: companies.filter(c => c.health >= 60 && c.health < 80),
        high_risk: companies.filter(c => c.health < 60),
        expansion_ready: companies.filter(c => (c.current_opportunity || '').length > 0 && c.health >= 70),
        exec_escalation: companies.filter(c => (c.primary_risk || '').toLowerCase().includes('escalat') || c.health < 50 || (c.outstanding_balance||0) > 0),
        upcoming_renewals: companies.filter(c => daysUntil(c.renewal_date) <= 45),
      }
      const heatmap = Object.entries(buckets).map(([k, v]) => ({
        key: k, count: v.length, arr: sum(v, c => c.arr), companies: v.map(c => ({ id:c.id, name:c.name, logo:c.logo, health:c.health, health_label:c.health_label, arr:c.arr, renewal_date:c.renewal_date }))
      }))

      // Segmentation
      const groupBy = (arr, key) => arr.reduce((a, c) => { const k = key(c); (a[k] = a[k] || { key:k, count:0, arr:0 }); a[k].count++; a[k].arr += c.arr; return a }, {})
      const seg_industry = Object.values(groupBy(companies, c => c.industry))
      const seg_plan = Object.values(groupBy(companies, c => c.plan))
      const seg_region = Object.values(groupBy(companies, c => c.region))
      const renewalMonth = (d) => new Date(d).toLocaleDateString('en-US',{month:'short',year:'2-digit'})
      const seg_renewal = Object.values(groupBy(companies, c => renewalMonth(c.renewal_date)))
        .sort((a,b) => new Date('1 '+a.key) - new Date('1 '+b.key))
      const seg_health = [
        { key:'80–100', count: buckets.healthy.length, arr: sum(buckets.healthy, c => c.arr) },
        { key:'60–79', count: buckets.needs_attention.length, arr: sum(buckets.needs_attention, c => c.arr) },
        { key:'<60', count: buckets.high_risk.length, arr: sum(buckets.high_risk, c => c.arr) },
      ]

      // Executive Attention items (different intent from Workbench cards — focused on revenue events)
      const attention = []
      // Renewal at risk
      companies.filter(c => daysUntil(c.renewal_date) <= 30 && c.atlas_confidence < 85)
        .sort((a,b) => daysUntil(a.renewal_date) - daysUntil(b.renewal_date))
        .slice(0,2).forEach(c => attention.push({
          kind: 'renewal_risk', tone: 'rose', icon: '🔥',
          company: { id:c.id, name:c.name, logo:c.logo, arr:c.arr },
          headline: `${fmtUSD(c.arr)} Renewal`,
          subline: `${daysUntil(c.renewal_date)} days remaining`,
          meta: `Atlas confidence ${c.atlas_confidence}%`,
          action: 'Executive meeting recommended',
        }))
      // Exec escalation
      companies.filter(c => c.health < 50 || (c.outstanding_balance||0) > 0)
        .slice(0,1).forEach(c => attention.push({
          kind: 'escalation', tone: 'amber', icon: '🟡',
          company: { id:c.id, name:c.name, logo:c.logo, arr:c.arr },
          headline: 'Executive escalation',
          subline: `${(tickets.filter(t => t.company_id === c.id && t.status !== 'Resolved').length)} open tickets · ${fmtUSD(c.outstanding_balance||0)} overdue`,
          meta: c.primary_risk,
          action: 'Schedule exec review',
        }))
      // Expansion ready
      companies.filter(c => c.health >= 80 && (c.current_opportunity||'').length > 0)
        .slice(0,2).forEach(c => attention.push({
          kind: 'expansion', tone: 'emerald', icon: '🟢',
          company: { id:c.id, name:c.name, logo:c.logo, arr:c.arr },
          headline: 'Expansion opportunity',
          subline: c.current_opportunity,
          meta: `Atlas confidence ${c.atlas_confidence}%`,
          action: 'Ready for proposal',
        }))

      // Executive metrics
      const exec_metrics = [
        { label:'Avg Health Score', value: portfolio_health, fmt:'score', trend: -2.1 },
        { label:'Avg CSAT', value: 4.4, fmt:'rating', trend: 0.1 },
        { label:'Avg Product Adoption', value: avg(companies, c => c.seats_purchased ? Math.round((c.seats_used/c.seats_purchased)*100) : 0), fmt:'pct', trend: 1.2 },
        { label:'Avg Exec Engagement', value: 62, fmt:'pct', trend: -14 },
        { label:'Avg Renewal Confidence', value: avg(companies, c => c.atlas_confidence), fmt:'pct', trend: 0.9 },
        { label:'Avg Response Time', value: 3.2, fmt:'hours', trend: -0.4 },
        { label:'Avg Time to Value', value: 18, fmt:'days', trend: -3 },
        { label:'Avg Usage Growth', value: 8.1, fmt:'pct', trend: 2.3 },
      ]

      // Portfolio timeline (strategic events only)
      const portfolio_timeline = [
        { kind:'renewal_closed', icon:'✅', tone:'emerald', title: 'Largest renewal closed', detail: 'Initech renewed Business plan for $180k', when: hoursAgo(7*24).toISOString() },
        { kind:'churn_risk', icon:'⚠️', tone:'rose', title: 'Biggest churn risk surfaced', detail: 'Globex champion departed; 3 P1 tickets open', when: hoursAgo(14*24).toISOString() },
        { kind:'sponsor_change', icon:'👤', tone:'amber', title: 'Executive sponsor changed', detail: 'Hooli CIO replaced; relationship cold', when: hoursAgo(42*24).toISOString() },
        { kind:'health_spike', icon:'📈', tone:'emerald', title: 'Health score spike', detail: 'Acme rose +12 after workflow launch', when: hoursAgo(21*24).toISOString() },
        { kind:'adoption_jump', icon:'🚀', tone:'indigo', title: 'Major adoption increase', detail: 'Umbrella AI Agents adoption +22 over 60d', when: hoursAgo(35*24).toISOString() },
      ].sort((a,b) => new Date(b.when) - new Date(a.when))

      // Goals
      const goals = [
        { id:'expansion', label:'Expansion (Q)', target: expansion_goal, current: expansion_current, fmt:'money', pacing: expansion_attainment - quarter_progress, explainer: expansion_attainment - quarter_progress >= 0 ? 'Ahead of pacing — keep momentum on Acme & Umbrella expansion.' : `${Math.abs(expansion_attainment - quarter_progress)}% behind pacing. Acme + Umbrella deals must close in the next 30 days.` },
        { id:'renewal', label:'Renewal (Q)', target: renewal_q_arr, current: Math.round(renewal_q_arr * (renewal_confidence/100)), fmt:'money', pacing: renewal_confidence - 90, explainer: `${renewing_q.length} renewals in this quarter; weighted forecast at ${renewal_confidence}%. ${renewal_confidence < 85 ? 'Hooli is the swing factor.' : 'Tracking strong.'}` },
        { id:'health', label:'Avg Health', target: 80, current: portfolio_health, fmt:'score', pacing: portfolio_health - 80, explainer: portfolio_health >= 80 ? 'On target.' : 'Globex (34) and Umbrella (55) are dragging the average. Recovery on both adds ~9 points.' },
        { id:'adoption', label:'Adoption %', target: 75, current: avg(companies, c => c.seats_purchased ? Math.round((c.seats_used/c.seats_purchased)*100) : 0), fmt:'pct', pacing: 0, explainer: 'Seat utilization across all accounts. Hooli reorg + Globex departure are the two pulls.' },
      ]

      const sources_used = ['Salesforce','Stripe','Chargebee','Zendesk','Mixpanel','Amplitude','Slack','Meeting Notes']

      return cors(NextResponse.json({
        greeting: { user: 'Subash' },
        kpis,
        revenue_chart: months,
        goals,
        heatmap,
        segments: { industry: seg_industry, plan: seg_plan, region: seg_region, renewal: seg_renewal, health: seg_health },
        exec_metrics,
        portfolio_timeline,
        attention,
        renewing_quarter: { count: renewing_q.length, arr: renewal_q_arr },
        sources_used,
      }))
    }

    if (route === '/dashboard/ai-summary' && method === 'POST') {
      const companies = cleanAll(await db.collection('companies').find({}).toArray())
      const compact = companies.map(c => ({
        name: c.name, industry: c.industry,
        arr: c.arr, mrr: c.mrr,
        health: c.health, health_trend: c.health_trend,
        renewal_days: daysUntil(c.renewal_date),
        atlas_confidence: c.atlas_confidence,
        primary_risk: c.primary_risk,
        current_opportunity: c.current_opportunity,
        atlas_summary: c.atlas_executive_summary,
      }))
      const sum = (arr, f) => arr.reduce((a, b) => a + (f(b) || 0), 0)
      const portfolio = {
        managed_arr: sum(compact, c => c.arr),
        avg_health: Math.round(sum(compact, c => c.health) / compact.length),
        accounts: compact.length,
        at_risk: compact.filter(c => c.health < 70).length,
      }

      const system = `You are Atlas, an AI analyst writing the morning executive briefing for a VP of Customer Success. Tone: confident, concise, evidence-grounded. Output strict JSON.`
      const user = `PORTFOLIO METRICS:\n${JSON.stringify(portfolio, null, 2)}\n\nACCOUNTS:\n${JSON.stringify(compact, null, 2)}\n\nReturn JSON with EXACT schema:\n{\n  "executive_summary": string (3-5 short sentences, name specific accounts, cite numbers),\n  "confidence": integer 0-100,\n  "reasoning": string (1 sentence \u2014 why this confidence),\n  "insights": [{ "title": string, "delta": string (e.g. \"+18%\" or \"-22%\"), "detail": string (1 sentence), "sentiment": one of [\"positive\",\"neutral\",\"negative\"], "sources": string[] (2-3 source apps) }] (6 items),\n  "forecast": {\n    "quarter_end_arr": integer (predict next quarter end ARR),\n    "expected_expansion": integer (next 90 days),\n    "expected_churn": integer (next 90 days),\n    "expected_renewals_count": integer,\n    "confidence": integer 0-100,\n    "biggest_risks": [{ "company": string, "risk": string, "impact": integer }] (2-3),\n    "biggest_opportunities": [{ "company": string, "opportunity": string, "impact": integer }] (2-3)\n  },\n  "recommendations": [{ "rank": integer, "title": string, "company": string, "action": string, "revenue_impact": integer, "kind": one of [\"protect\",\"expand\",\"escalate\"] }] (3-5 items, ranked by revenue impact)\n}`

      const result = await callLLM({ system, user, json: true })
      result.last_updated = new Date().toISOString()
      result.sources_used = ['Salesforce','Stripe','Chargebee','Zendesk','Mixpanel','Amplitude','Slack','Meeting Notes']
      // Cache
      await db.collection('briefs').updateOne({ id: 'dashboard-ai' }, { $set: { id: 'dashboard-ai', result, created_at: new Date().toISOString() } }, { upsert: true })
      return cors(NextResponse.json(result))
    }

    if (route === '/dashboard' && method === 'GET') {
      await ensureSeeded()
      const companies = cleanAll(await db.collection('companies').find({}).toArray())
      const meetingsAll = cleanAll(await db.collection('meetings').find({}).sort({ scheduled_at: 1 }).toArray())
      const start = new Date(); start.setHours(0,0,0,0)
      const end = new Date(); end.setHours(23,59,59,999)
      const todays = meetingsAll.filter(m => {
        const d = new Date(m.scheduled_at); return d >= start && d <= end
      })
      const upcoming = meetingsAll.filter(m => new Date(m.scheduled_at) > end).slice(0,5)
      const highRisk = companies.filter(c => c.health < 70).sort((a,b)=>a.health-b.health)
      const emails = cleanAll(await db.collection('emails').find({}).sort({ timestamp: -1 }).limit(8).toArray())
      const tickets = cleanAll(await db.collection('tickets').find({ status: { $ne: 'Resolved' } }).sort({ opened: -1 }).limit(8).toArray())
      const compMap = Object.fromEntries(companies.map(c => [c.id, c]))
      const todayMeetings = todays.map(m => ({ ...m, company: compMap[m.company_id] }))
      const upcomingMeetings = upcoming.map(m => ({ ...m, company: compMap[m.company_id] }))
      const recentActivity = [
        ...emails.slice(0,5).map(e => ({ type:'email', title:`Email from ${e.from}`, detail:e.subject, at:e.timestamp, company: compMap[e.company_id] })),
        ...tickets.slice(0,3).map(t => ({ type:'ticket', title:`${t.priority} • ${t.subject}`, detail:`${t.status}`, at:t.opened, company: compMap[t.company_id] })),
      ].sort((a,b)=> new Date(b.at) - new Date(a.at)).slice(0,8)
      return cors(NextResponse.json({ todayMeetings, upcomingMeetings, highRisk, recentActivity, totals: { companies: companies.length, openTickets: tickets.length } }))
    }

    if (route === '/companies' && method === 'GET') {
      await ensureSeeded()
      const companies = cleanAll(await db.collection('companies').find({}).toArray())
      return cors(NextResponse.json(companies))
    }

    if (route.startsWith('/companies/') && method === 'GET') {
      const parts = route.split('/')
      const id = parts[2]
      if (parts[3] === 'timeline') {
        const ctx = await getCompanyContext(id)
        return cors(NextResponse.json({ company: ctx.company, timeline: buildTimeline(ctx) }))
      }
      const ctx = await getCompanyContext(id)
      if (!ctx.company) return cors(NextResponse.json({ error: 'not found' }, { status: 404 }))
      const timeline = buildTimeline(ctx)
      const invoices = cleanAll(await db.collection('invoices').find({ company_id: id }).sort({ date: -1 }).toArray())
      // Inject invoices into timeline
      invoices.forEach(inv => timeline.push({
        type: 'invoice', id: inv.id,
        title: `Invoice ${inv.number} \u2014 $${inv.amount.toLocaleString()}`,
        detail: `${inv.period} \u2022 ${inv.status}`, meta: inv.status, at: inv.date+'T09:00:00Z'
      }))
      timeline.sort((a,b) => new Date(b.at) - new Date(a.at))
      return cors(NextResponse.json({ ...ctx, timeline, invoices }))
    }

    // ---------- KNOWLEDGE ----------
    if (route === '/policies' && method === 'GET') {
      const policies = cleanAll(await db.collection('policies').find({}).sort({ category: 1, title: 1 }).toArray())
      return cors(NextResponse.json(policies))
    }

    if (route === '/knowledge/search' && method === 'POST') {
      const body = await request.json()
      const q = (body.query || '').trim()
      if (!q) return cors(NextResponse.json({ error: 'query required' }, { status: 400 }))
      const policies = cleanAll(await db.collection('policies').find({}).toArray())
      const system = `You are Atlas Knowledge, an internal policy search assistant. Answer the question from the policies provided. Cite specific policies. Be concise but complete. If unsure, say so and lower confidence. Output strict JSON.`
      const user = `QUESTION: "${q}"\n\nPOLICIES (JSON array):\n${JSON.stringify(policies.map(p => ({ id:p.id, title:p.title, category:p.category, body:p.body })), null, 2)}\n\nReturn JSON:\n{\n  "answer": string (markdown OK, 80-200 words),\n  "confidence": integer 0-100,\n  "reasoning": string (1-2 sentences \u2014 why this confidence),\n  "missing_info": string[] (questions Atlas would still want answered),\n  "sources": [{ "policy_id": string, "excerpt": string (relevant quoted snippet), "relevance": integer 0-100 }]\n}`
      const result = await callLLM({ system, user, json: true })
      // Hydrate sources with policy metadata
      const polMap = Object.fromEntries(policies.map(p => [p.id, p]))
      result.sources = (result.sources || []).map(s => ({ ...s, policy: polMap[s.policy_id] })).filter(s => s.policy)
      return cors(NextResponse.json(result))
    }

    // ---------- COMMERCIAL ----------
    if (route === '/products' && method === 'GET') {
      const products = cleanAll(await db.collection('products').find({}).toArray())
      return cors(NextResponse.json(products))
    }

    if (route === '/invoices' && method === 'GET') {
      const url = new URL(request.url)
      const company_id = url.searchParams.get('company_id')
      const q = company_id ? { company_id } : {}
      const invoices = cleanAll(await db.collection('invoices').find(q).sort({ date: -1 }).toArray())
      return cors(NextResponse.json(invoices))
    }

    if (route === '/quote/calculate' && method === 'POST') {
      const body = await request.json()
      const { company_id, line_items = [], discount_pct = 0 } = body
      const company = await db.collection('companies').findOne({ id: company_id })
      if (!company) return cors(NextResponse.json({ error: 'company not found' }, { status: 404 }))
      const products = cleanAll(await db.collection('products').find({}).toArray())
      const prodMap = Object.fromEntries(products.map(p => [p.id, p]))

      // Calculate
      let additionalArr = 0
      const items = line_items.map(li => {
        const p = prodMap[li.product_id]
        if (!p) return { ...li, error: 'unknown product' }
        const qty = li.quantity || 0
        const unit = p.price_per_seat || 0
        const flat = p.flat_annual || 0
        const lineArr = qty * unit + (qty > 0 ? flat : 0) * (li.include_flat ? 1 : 0)
        additionalArr += lineArr * (li.action === 'remove' ? -1 : 1)
        return { ...li, product: p, line_arr: lineArr * (li.action === 'remove' ? -1 : 1) }
      })

      // Apply discount
      const grossArr = additionalArr
      const discountAmt = Math.round(grossArr * (discount_pct/100))
      const netArr = grossArr - discountAmt
      const additionalMrr = Math.round(netArr / 12)

      // Days remaining in contract
      const renewalDate = new Date(company.renewal_date)
      const daysRemaining = Math.max(1, Math.round((renewalDate - Date.now()) / 86400000))
      const proratedAmount = Math.round(netArr * (daysRemaining / 365))

      // Approval routing
      let approval_required = 'auto'
      let approver = 'CSM auto-approve'
      if (discount_pct > 40) { approval_required = 'exec'; approver = 'CEO + CFO' }
      else if (discount_pct > 25) { approval_required = 'cfo'; approver = 'CFO' }
      else if (discount_pct > 15) { approval_required = 'vp'; approver = 'VP Customer Success' }

      // Revenue difference
      const currentArr = company.net_price || company.arr || 0
      const newArr = currentArr + netArr
      const revenueDifference = netArr

      return cors(NextResponse.json({
        company: { id: company.id, name: company.name, current_arr: currentArr, current_mrr: company.mrr, renewal_date: company.renewal_date },
        items,
        gross_additional_arr: grossArr,
        discount_pct,
        discount_amount: discountAmt,
        additional_arr: netArr,
        additional_mrr: additionalMrr,
        prorated_amount: proratedAmount,
        days_remaining: daysRemaining,
        new_arr: newArr,
        revenue_difference: revenueDifference,
        approval_required,
        approver,
      }))
    }

    if (route === '/quote/save' && method === 'POST') {
      const body = await request.json()
      const record = { id: uuidv4(), ...body, created_at: new Date().toISOString(), status: 'draft' }
      await db.collection('quotes').insertOne(record)
      return cors(NextResponse.json(clean(record)))
    }

    if (route === '/search' && method === 'GET') {
      await ensureSeeded()
      const q = (new URL(request.url)).searchParams.get('q') || ''
      if (!q) return cors(NextResponse.json([]))
      const re = new RegExp(q, 'i')
      const companies = cleanAll(await db.collection('companies').find({ $or: [{ name: re }, { industry: re }] }).limit(10).toArray())
      const contacts = cleanAll(await db.collection('contacts').find({ $or: [{ name: re }, { email: re }, { title: re }] }).limit(10).toArray())
      return cors(NextResponse.json({ companies, contacts }))
    }

    if (route === '/brief' && method === 'POST') {
      const body = await request.json()
      const { companyId, meetingId } = body
      const ctx = await getCompanyContext(companyId)
      if (!ctx.company) return cors(NextResponse.json({ error: 'company not found' }, { status: 404 }))
      const meeting = meetingId ? ctx.meetings.find(m => m.id === meetingId) : ctx.meetings[0]

      const system = `You are Atlas, an elite Customer Success AI assistant. You produce concise, executive-grade meeting briefs that save CSMs at least 30 minutes of prep. Be specific, reference real evidence from the data provided. Avoid generic phrases. Output strict JSON.`
      const user = `Generate a meeting brief.\n\nMEETING:\n${JSON.stringify(meeting, null, 2)}\n\nCOMPANY:\n${JSON.stringify(ctx.company, null, 2)}\n\nCONTACTS:\n${JSON.stringify(ctx.contacts, null, 2)}\n\nRECENT EMAILS:\n${JSON.stringify(ctx.emails.slice(0,8), null, 2)}\n\nOPEN TICKETS:\n${JSON.stringify(ctx.tickets, null, 2)}\n\nCRM NOTES:\n${JSON.stringify(ctx.notes, null, 2)}\n\nReturn JSON with EXACT keys:\n{\n  "executive_summary": string (3-5 sentences),\n  "recent_activity": string[] (4-6 bullets),\n  "open_issues": string[] (each issue with severity tag),\n  "sentiment": { "label": one of ["Positive","Neutral","Mixed","Negative"], "reasoning": string },\n  "renewal_status": { "label": string, "days_to_renewal": number, "summary": string },\n  "risks": string[] (3-5 specific risks),\n  "expansion_opportunities": string[] (2-4 concrete opportunities),\n  "talking_points": string[] (5-7 actionable talking points in priority order),\n  "next_actions": [{ "action": string, "owner": string, "due": string }] (3-5 items)\n}`

      const brief = await callLLM({ system, user, json: true })
      const record = {
        id: uuidv4(),
        company_id: companyId,
        meeting_id: meeting?.id,
        brief,
        created_at: new Date().toISOString(),
      }
      await db.collection('briefs').insertOne(record)
      return cors(NextResponse.json(clean(record)))
    }

    if (route === '/followup' && method === 'POST') {
      const body = await request.json()
      const { companyId, meetingId, transcript } = body
      const ctx = await getCompanyContext(companyId)
      if (!ctx.company) return cors(NextResponse.json({ error: 'company not found' }, { status: 404 }))
      const meeting = meetingId ? ctx.meetings.find(m => m.id === meetingId) : ctx.meetings[0]
      const latestBrief = await db.collection('briefs').findOne({ company_id: companyId }, { sort: { created_at: -1 } })

      const system = `You are Atlas. Produce a post-meeting follow-up package. Email must be professional, specific, reference what was discussed. Output strict JSON.`
      const user = `Generate follow-up.\n\nMEETING:\n${JSON.stringify(meeting, null, 2)}\n\nCOMPANY:\n${JSON.stringify(ctx.company, null, 2)}\n\nLATEST BRIEF:\n${JSON.stringify(latestBrief?.brief, null, 2)}\n\nTRANSCRIPT / MEETING NOTES:\n${transcript || '(no transcript provided — infer reasonable outcomes from brief and context)'}\n\nReturn JSON with keys:\n{\n  "email": { "to": string[], "subject": string, "body": string (markdown OK, 200-350 words) },\n  "crm_note": string (concise structured note, 100-180 words),\n  "tasks": [{ "title": string, "owner": string, "due": string, "priority": one of ["P1","P2","P3"] }] (3-6 tasks)\n}`

      const result = await callLLM({ system, user, json: true })
      const record = {
        id: uuidv4(),
        company_id: companyId,
        meeting_id: meeting?.id,
        result,
        approved: false,
        created_at: new Date().toISOString(),
      }
      await db.collection('followups').insertOne(record)
      return cors(NextResponse.json(clean(record)))
    }

    if (route === '/followup/approve' && method === 'POST') {
      const body = await request.json()
      const fu = await db.collection('followups').findOne({ id: body.id })
      if (!fu) return cors(NextResponse.json({ error: 'not found' }, { status: 404 }))
      // Mock execution: persist tasks, mark approved
      const taskDocs = (fu.result?.tasks || []).map(t => ({
        id: uuidv4(),
        company_id: fu.company_id,
        followup_id: fu.id,
        ...t,
        status: 'Open',
        created_at: new Date().toISOString(),
      }))
      if (taskDocs.length) await db.collection('tasks').insertMany(taskDocs)
      await db.collection('followups').updateOne({ id: body.id }, { $set: { approved: true, approved_at: new Date().toISOString() } })
      return cors(NextResponse.json({ ok: true, tasks_created: taskDocs.length }))
    }

    // ---------- WORKBENCH ----------
    if (route === '/workbench/overview' && method === 'GET') {
      await ensureSeeded()
      const companies = cleanAll(await db.collection('companies').find({}).toArray())
      const meetingsAll = cleanAll(await db.collection('meetings').find({}).toArray())
      const tickets = cleanAll(await db.collection('tickets').find({ status: { $ne: 'Resolved' } }).toArray())
      const start = new Date(); start.setHours(0,0,0,0)
      const end = new Date(); end.setHours(23,59,59,999)
      const todays = meetingsAll.filter(m => { const d = new Date(m.scheduled_at); return d >= start && d <= end })
      const highRisk = companies.filter(c => c.health < 70)
      const expansion = companies.filter(c => c.health >= 80 || (c.strategic_notes||'').toLowerCase().includes('expansion'))
      const renewals30 = companies.filter(c => {
        const days = Math.round((new Date(c.renewal_date) - Date.now())/86400000)
        return days <= 30
      })
      const pending = await db.collection('workbench_cards').countDocuments({ status: 'ready' })
      return cors(NextResponse.json({
        highRisk: highRisk.length,
        expansion: expansion.length,
        renewals: renewals30.length,
        meetings: todays.length,
        approvals: pending,
        openTickets: tickets.length,
      }))
    }

    if (route === '/workbench/cards' && method === 'GET') {
      await ensureSeeded()
      const cards = cleanAll(await db.collection('workbench_cards').find({ status: { $in: ['ready','approved'] } }).sort({ priority_rank: 1, created_at: -1 }).limit(20).toArray())
      const companies = cleanAll(await db.collection('companies').find({}).toArray())
      const map = Object.fromEntries(companies.map(c => [c.id, c]))
      return cors(NextResponse.json(cards.map(c => ({ ...c, company: map[c.company_id] }))))
    }

    if (route === '/workbench/proactive' && method === 'POST') {
      // Generate proactive cards by analyzing the portfolio
      await ensureSeeded()
      const companies = cleanAll(await db.collection('companies').find({}).toArray())
      // Build compact portfolio snapshot
      const portfolio = await Promise.all(companies.map(async c => {
        const ctx = await getCompanyContext(c.id)
        return {
          company: c,
          contacts: ctx.contacts.slice(0,3),
          recent_emails: ctx.emails.slice(0,4).map(e => ({ from:e.from, subject:e.subject, snippet:e.snippet, sentiment:e.sentiment, when:e.timestamp })),
          open_tickets: ctx.tickets.filter(t => t.status !== 'Resolved'),
          notes: ctx.notes.slice(0,2),
          next_meeting: ctx.meetings.find(m => new Date(m.scheduled_at) > new Date()),
        }
      }))

      const system = `You are Atlas, an elite AI Chief of Staff for Customer Success Managers. Your job is to scan the CSM's entire portfolio and identify the 5 highest-value next-best-actions they should take TODAY. For each, you generate the complete deliverable so the CSM only needs to review and approve. Be specific, evidence-grounded, and assertive. No generic advice. Output strict JSON.`
      const user = `PORTFOLIO SNAPSHOT:\n${JSON.stringify(portfolio, null, 2)}\n\nReturn JSON: { "cards": [ ... 5 items ... ] }\n\nEach card has EXACT schema:\n{\n  "company_id": string,\n  "intent": one of ["draft_email","prepare_meeting","summarize","schedule_call","success_plan","update_crm","executive_escalation"],\n  "priority": one of ["P0","P1","P2"],\n  "title": short string (e.g. "Globex executive escalation"),\n  "reason": 1-2 sentences explaining why Atlas surfaced this NOW (cite specific evidence),\n  "business_impact": 1 sentence with concrete $ figure,\n  "recommended_action": 1 sentence,\n  "estimated_seconds": integer between 20 and 90,\n  "artifacts": {\n    "email": optional { "to": string[], "subject": string, "body": string (200-350 words, markdown OK), "suggested_send_time": string },\n    "crm_note": optional string,\n    "tasks": optional [{ "title": string, "owner": string, "due": string, "priority": one of ["P1","P2","P3"] }],\n    "success_plan": optional { "milestones": [{ "title": string, "owner": string, "due": string, "description": string }] },\n    "summary": optional string\n  }\n}\n\nRules:\n- Mix card types (email, escalation, success plan, expansion proposal, schedule_call, etc.)\n- Rank P0 first (urgent, business-critical), then P1, then P2\n- Each card MUST include artifacts populated for its intent (draft_email \u2192 email, success_plan \u2192 success_plan, etc.)\n- Make emails reference actual evidence from the portfolio (specific tickets, names, dates)\n- Suggested_send_time should be a realistic ISO datetime within next 24h`

      const result = await callLLM({ system, user, json: true })
      const cards = (result.cards || []).map((c, i) => ({
        id: uuidv4(),
        source: 'proactive',
        prompt: null,
        status: 'ready',
        priority_rank: c.priority === 'P0' ? 0 : c.priority === 'P1' ? 1 : 2,
        created_at: new Date().toISOString(),
        ...c,
      }))
      // Replace previous proactive cards
      await db.collection('workbench_cards').deleteMany({ source: 'proactive', status: { $ne: 'approved' } })
      if (cards.length) await db.collection('workbench_cards').insertMany(cards)
      const companiesMap = Object.fromEntries(companies.map(c => [c.id, c]))
      return cors(NextResponse.json(cards.map(c => ({ ...c, company: companiesMap[c.company_id] }))))
    }

    if (route === '/workbench/execute' && method === 'POST') {
      // User-typed command → detect intent + generate artifact in one call
      const body = await request.json()
      const prompt = (body.prompt || '').trim()
      if (!prompt) return cors(NextResponse.json({ error: 'prompt required' }, { status: 400 }))
      const companies = cleanAll(await db.collection('companies').find({}).toArray())
      const companyList = companies.map(c => ({ id: c.id, name: c.name, industry: c.industry, health: c.health, renewal_date: c.renewal_date }))

      const system = `You are Atlas, an AI Chief of Staff. The CSM gives you a natural-language command. You must: (1) detect the target company from the list, (2) detect the intent, (3) read the customer memory, (4) generate the complete deliverable. Output strict JSON.`
      // First detect target company
      const detectUser = `COMMAND: "${prompt}"\n\nAVAILABLE COMPANIES:\n${JSON.stringify(companyList, null, 2)}\n\nReturn JSON:\n{\n  "company_id": string (best match) or null if no clear company referenced,\n  "intent": one of ["draft_email","prepare_meeting","summarize","schedule_call","success_plan","update_crm","executive_escalation"],\n  "topic": short string describing what the deliverable should cover\n}`
      const detect = await callLLM({ system, user: detectUser, json: true })
      if (!detect.company_id) {
        return cors(NextResponse.json({ error: 'Could not identify which company. Try mentioning the company by name.' }, { status: 400 }))
      }
      const ctx = await getCompanyContext(detect.company_id)
      if (!ctx.company) return cors(NextResponse.json({ error: 'Company not found' }, { status: 404 }))

      const genUser = `THE CSM ASKED: "${prompt}"\nDETECTED INTENT: ${detect.intent}\nTOPIC: ${detect.topic}\n\nCOMPANY:\n${JSON.stringify(ctx.company, null, 2)}\n\nCONTACTS:\n${JSON.stringify(ctx.contacts, null, 2)}\n\nRECENT EMAILS:\n${JSON.stringify(ctx.emails.slice(0,6), null, 2)}\n\nOPEN TICKETS:\n${JSON.stringify(ctx.tickets.filter(t => t.status !== 'Resolved'), null, 2)}\n\nNOTES:\n${JSON.stringify(ctx.notes, null, 2)}\n\nGenerate the complete deliverable card. Return JSON with EXACT schema:\n{\n  "company_id": "${detect.company_id}",\n  "intent": "${detect.intent}",\n  "priority": one of ["P0","P1","P2"],\n  "title": short string,\n  "reason": 1-2 sentences,\n  "business_impact": 1 sentence with $ figure,\n  "recommended_action": 1 sentence,\n  "estimated_seconds": integer 20-90,\n  "artifacts": {\n    "email": { "to": string[], "subject": string, "body": string (200-350 words), "suggested_send_time": string } (if intent involves email),\n    "crm_note": string (if update_crm or follow-up),\n    "tasks": [{ "title", "owner", "due", "priority" }] (always include 2-4),\n    "success_plan": { "milestones": [{ "title", "owner", "due", "description" }] } (if success_plan intent),\n    "summary": string (if summarize intent)\n  }\n}\n\nMake the artifact concrete, evidence-grounded, and ready to send.`

      const card = await callLLM({ system, user: genUser, json: true })
      const record = {
        id: uuidv4(),
        source: 'user_prompt',
        prompt,
        status: 'ready',
        priority_rank: card.priority === 'P0' ? 0 : card.priority === 'P1' ? 1 : 2,
        created_at: new Date().toISOString(),
        ...card,
      }
      await db.collection('workbench_cards').insertOne(record)
      const companiesMap = Object.fromEntries(companies.map(c => [c.id, c]))
      return cors(NextResponse.json({ ...clean(record), company: companiesMap[record.company_id] }))
    }

    if (route.startsWith('/workbench/cards/') && method === 'POST') {
      const parts = route.split('/')
      const id = parts[3]
      const action = parts[4]
      const card = await db.collection('workbench_cards').findOne({ id })
      if (!card) return cors(NextResponse.json({ error: 'not found' }, { status: 404 }))
      if (action === 'approve') {
        // Persist tasks to tasks collection
        const taskDocs = (card.artifacts?.tasks || []).map(t => ({
          id: uuidv4(),
          company_id: card.company_id,
          card_id: card.id,
          ...t,
          status: 'Open',
          created_at: new Date().toISOString(),
        }))
        if (taskDocs.length) await db.collection('tasks').insertMany(taskDocs)
        await db.collection('workbench_cards').updateOne({ id }, { $set: { status: 'approved', approved_at: new Date().toISOString() } })
        return cors(NextResponse.json({ ok: true, tasks_created: taskDocs.length }))
      }
      if (action === 'dismiss') {
        await db.collection('workbench_cards').updateOne({ id }, { $set: { status: 'dismissed', dismissed_at: new Date().toISOString() } })
        return cors(NextResponse.json({ ok: true }))
      }
      if (action === 'update') {
        const body = await request.json()
        const patch = {}
        if (body.artifacts) patch.artifacts = body.artifacts
        if (body.title) patch.title = body.title
        patch.edited_at = new Date().toISOString()
        patch.edited = true
        await db.collection('workbench_cards').updateOne({ id }, { $set: patch })
        const updated = await db.collection('workbench_cards').findOne({ id })
        return cors(NextResponse.json(clean(updated)))
      }
      if (action === 'regenerate') {
        // Re-run generation with same intent and (optionally) prompt
        const ctx = await getCompanyContext(card.company_id)
        if (!ctx.company) return cors(NextResponse.json({ error: 'company not found' }, { status: 404 }))
        const system = `You are Atlas, an AI Chief of Staff. Regenerate a fresh deliverable for the CSM. Be specific, evidence-grounded, ready to send. Output strict JSON.`
        const user = `INTENT: ${card.intent}\nORIGINAL PROMPT: ${card.prompt || '(proactive)'}\nORIGINAL TITLE: ${card.title}\nREASON IT MATTERED: ${card.reason}\n\nCOMPANY:\n${JSON.stringify(ctx.company, null, 2)}\n\nCONTACTS:\n${JSON.stringify(ctx.contacts, null, 2)}\n\nRECENT EMAILS:\n${JSON.stringify(ctx.emails.slice(0,6), null, 2)}\n\nOPEN TICKETS:\n${JSON.stringify(ctx.tickets.filter(t => t.status !== 'Resolved'), null, 2)}\n\nNOTES:\n${JSON.stringify(ctx.notes, null, 2)}\n\nReturn JSON with the SAME schema as before:\n{\n  "title": string,\n  "priority": "P0" | "P1" | "P2",\n  "reason": string,\n  "business_impact": string,\n  "recommended_action": string,\n  "estimated_seconds": integer,\n  "artifacts": { "email"?, "crm_note"?, "tasks"?, "success_plan"?, "summary"? }\n}\n\nMake this DIFFERENT and improved compared to the prior version. Vary tone or angle.`
        const result = await callLLM({ system, user, json: true })
        const patch = {
          title: result.title || card.title,
          priority: result.priority || card.priority,
          reason: result.reason || card.reason,
          business_impact: result.business_impact || card.business_impact,
          recommended_action: result.recommended_action || card.recommended_action,
          estimated_seconds: result.estimated_seconds || card.estimated_seconds,
          artifacts: result.artifacts || card.artifacts,
          edited: false,
          regenerated_at: new Date().toISOString(),
        }
        await db.collection('workbench_cards').updateOne({ id }, { $set: patch })
        const updated = await db.collection('workbench_cards').findOne({ id })
        const companies = cleanAll(await db.collection('companies').find({}).toArray())
        const compMap = Object.fromEntries(companies.map(c => [c.id, c]))
        return cors(NextResponse.json({ ...clean(updated), company: compMap[updated.company_id] }))
      }
      return cors(NextResponse.json({ error: 'unknown action' }, { status: 400 }))
    }

    if (route === '/tasks' && method === 'GET') {
      const tasks = cleanAll(await db.collection('tasks').find({}).sort({ created_at: -1 }).toArray())
      const companies = cleanAll(await db.collection('companies').find({}).toArray())
      const map = Object.fromEntries(companies.map(c => [c.id, c]))
      return cors(NextResponse.json(tasks.map(t => ({ ...t, company: map[t.company_id] }))))
    }

    return cors(NextResponse.json({ error: `Route ${route} not found` }, { status: 404 }))
  } catch (e) {
    console.error('API Error:', e)
    return cors(NextResponse.json({ error: 'Internal server error', detail: e.message }, { status: 500 }))
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute

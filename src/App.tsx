import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BriefcaseBusiness,
  ChevronDown,
  CircleDollarSign,
  FlaskConical,
  Gauge,
  ShieldCheck,
  Target,
  TrendingUp,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { EquityChart } from './components/EquityChart'
import { MetricCard } from './components/MetricCard'
import { AS_OF_DATE, demoTrades } from './data/demoPortfolio'
import {
  buildAllocation,
  buildEquityCurve,
  buildMetrics,
  buildMonthlyReturns,
  enrichTrade,
  filterTrades,
} from './lib/analytics'
import { formatCurrency, formatDate, formatPercent } from './lib/format'
import type { Account } from './types'

type Range = '1Y' | 'ALL'
type AccountFilter = 'All' | Account

const rangeStart: Record<Range, string | null> = {
  '1Y': '2025-07-15',
  ALL: null,
}

function tone(value: number) {
  return value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral'
}

function App() {
  const [range, setRange] = useState<Range>('ALL')
  const [account, setAccount] = useState<AccountFilter>('All')

  const visibleTrades = useMemo(
    () => filterTrades(demoTrades, account, rangeStart[range]),
    [account, range],
  )
  const metrics = useMemo(() => buildMetrics(visibleTrades), [visibleTrades])
  const equity = useMemo(() => buildEquityCurve(visibleTrades), [visibleTrades])
  const monthly = useMemo(() => buildMonthlyReturns(visibleTrades).slice(-12), [visibleTrades])
  const allocation = useMemo(() => buildAllocation(visibleTrades), [visibleTrades])
  const openPositions = useMemo(
    () => visibleTrades.map(enrichTrade).filter((trade) => trade.isOpen).sort((a, b) => b.pnl - a.pnl),
    [visibleTrades],
  )
  const maxMonthlyMagnitude = Math.max(...monthly.map((item) => Math.abs(item.pnl)), 1)

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Atlas portfolio analytics home">
          <span className="brand__mark"><BarChart3 size={20} /></span>
          <span>ATLAS</span>
          <span className="brand__divider" />
          <small>Portfolio intelligence</small>
        </a>
        <div className="demo-badge"><FlaskConical size={14} /> Synthetic demo</div>
      </header>

      <section className="hero" id="top">
        <div>
          <p className="eyebrow">Decision-ready analytics</p>
          <h1>See the portfolio.<br /><em>Understand the risk.</em></h1>
          <p className="hero__copy">
            A privacy-safe analytics workspace that turns position-level activity into a clear view of
            performance, exposure, and decision quality.
          </p>
        </div>
        <div className="hero__status">
          <span><ShieldCheck size={16} /> Local-first demo</span>
          <strong>As of {formatDate(AS_OF_DATE)}</strong>
          <small>No accounts connected · no network requests</small>
        </div>
      </section>

      <section className="controlbar" aria-label="Dashboard filters">
        <div className="segmented" aria-label="Time range">
          {(['1Y', 'ALL'] as Range[]).map((option) => (
            <button
              aria-pressed={range === option}
              className={range === option ? 'is-active' : ''}
              key={option}
              onClick={() => setRange(option)}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
        <label className="select-control">
          <span>Account</span>
          <select value={account} onChange={(event) => setAccount(event.target.value as AccountFilter)}>
            <option>All</option>
            <option>Core</option>
            <option>Tactical</option>
          </select>
          <ChevronDown aria-hidden="true" size={14} />
        </label>
      </section>

      <section className="metric-grid" aria-label="Portfolio summary">
        <MetricCard icon={CircleDollarSign} label="Net P&L" value={formatCurrency(metrics.totalPnl)} detail={`${formatCurrency(metrics.unrealizedPnl)} currently unrealized`} tone={tone(metrics.totalPnl)} />
        <MetricCard icon={Target} label="Win rate" value={formatPercent(metrics.winRate)} detail={`${metrics.closedTrades} closed positions`} />
        <MetricCard icon={Gauge} label="Max drawdown" value={formatPercent(metrics.maxDrawdown)} detail="Peak-to-trough equity decline" tone={tone(metrics.maxDrawdown)} />
        <MetricCard icon={Activity} label="Profit factor" value={metrics.profitFactor.toFixed(2)} detail="Gross profit ÷ gross loss" tone={metrics.profitFactor >= 1 ? 'positive' : 'negative'} />
      </section>

      <section className="dashboard-grid">
        <article className="panel panel--chart">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Equity curve</p>
              <h2>{formatCurrency(equity.at(-1)?.value ?? 0)}</h2>
            </div>
            <div className={`delta delta--${tone(metrics.totalPnl)}`}>
              <TrendingUp size={15} /> {formatCurrency(metrics.totalPnl)}
            </div>
          </div>
          <EquityChart points={equity} />
        </article>

        <aside className="panel allocation-panel">
          <div className="panel__header panel__header--compact">
            <div>
              <p className="eyebrow">Open exposure</p>
              <h2>{formatCurrency(metrics.capitalDeployed)}</h2>
            </div>
            <BriefcaseBusiness size={19} />
          </div>
          <div className="allocation-list">
            {allocation.map((item, index) => (
              <div className="allocation" key={item.name}>
                <div><span><i style={{ '--bar-color': `var(--chart-${index + 1})` } as React.CSSProperties} />{item.name}</span><strong>{formatPercent(item.share, 0)}</strong></div>
                <div className="allocation__track"><span style={{ width: `${item.share}%`, background: `var(--chart-${index + 1})` }} /></div>
              </div>
            ))}
          </div>
          {!allocation.length && <p className="empty-state">No open positions in this view.</p>}
        </aside>
      </section>

      <section className="dashboard-grid dashboard-grid--lower">
        <article className="panel">
          <div className="panel__header panel__header--compact">
            <div><p className="eyebrow">Monthly outcomes</p><h2>Last 12 active months</h2></div>
            <BarChart3 size={19} />
          </div>
          <div className="monthly-bars">
            {monthly.map((item) => (
              <div className="monthly-bar" key={item.month}>
                <span>{new Date(`${item.month}-02T00:00:00`).toLocaleDateString('en-US', { month: 'short' })}</span>
                <div><i className={item.pnl >= 0 ? 'bar--positive' : 'bar--negative'} style={{ width: `${Math.max(7, Math.abs(item.pnl) / maxMonthlyMagnitude * 100)}%` }} /></div>
                <strong className={`value--${tone(item.pnl)}`}>{formatCurrency(item.pnl)}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel__header panel__header--compact">
            <div><p className="eyebrow">Current positions</p><h2>{openPositions.length} active ideas</h2></div>
            <span className="live-indicator"><i /> Marked to demo prices</span>
          </div>
          <div className="position-list">
            {openPositions.map((trade) => (
              <div className="position" key={trade.id}>
                <div className="position__symbol">{trade.symbol.slice(0, 2)}</div>
                <div className="position__name"><strong>{trade.symbol}</strong><span>{trade.company}</span></div>
                <div className="position__meta"><strong>{trade.account}</strong><span>{trade.side} · {trade.quantity} units</span></div>
                <div className={`position__pnl value--${tone(trade.pnl)}`}>
                  {trade.pnl >= 0 ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
                  <div><strong>{formatCurrency(trade.pnl)}</strong><span>{formatPercent(trade.pnlPercent)}</span></div>
                </div>
              </div>
            ))}
          </div>
          {!openPositions.length && <p className="empty-state">No open positions in this view.</p>}
        </article>
      </section>

      <footer>
        <span><FlaskConical size={14} /> Every value on this page is fictional and deterministic.</span>
        <span>React · TypeScript · Recharts · Vitest</span>
      </footer>
    </main>
  )
}

export default App

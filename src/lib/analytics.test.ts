import { describe, expect, it } from 'vitest'

import type { Trade } from '../types'
import { buildEquityCurve, buildMetrics, enrichTrade, filterTrades } from './analytics'

const baseTrade: Trade = {
  id: 'test-1',
  symbol: 'TEST',
  company: 'Test Company',
  sector: 'Software',
  assetClass: 'Equity',
  account: 'Core',
  side: 'Long',
  quantity: 10,
  multiplier: 1,
  entryPrice: 100,
  exitPrice: 110,
  currentPrice: 110,
  openedAt: '2026-01-01',
  closedAt: '2026-02-01',
}

describe('portfolio analytics', () => {
  it('calculates direction-aware P&L', () => {
    expect(enrichTrade(baseTrade).pnl).toBe(100)
    expect(enrichTrade({ ...baseTrade, side: 'Short', exitPrice: 90, currentPrice: 90 }).pnl).toBe(100)
    expect(enrichTrade({ ...baseTrade, side: 'Short' }).pnl).toBe(-100)
  })

  it('separates realized and unrealized performance', () => {
    const openWinner = { ...baseTrade, id: 'test-2', closedAt: null, exitPrice: null, currentPrice: 105 }
    const metrics = buildMetrics([baseTrade, openWinner])

    expect(metrics.realizedPnl).toBe(100)
    expect(metrics.unrealizedPnl).toBe(50)
    expect(metrics.totalPnl).toBe(150)
    expect(metrics.closedTrades).toBe(1)
  })

  it('filters by account and effective event date', () => {
    const tactical = { ...baseTrade, id: 'test-2', account: 'Tactical' as const, closedAt: '2025-01-01' }

    expect(filterTrades([baseTrade, tactical], 'Core', null)).toEqual([baseTrade])
    expect(filterTrades([baseTrade, tactical], 'All', '2026-01-01')).toEqual([baseTrade])
  })

  it('produces a chronological equity curve with drawdown', () => {
    const loss = { ...baseTrade, id: 'test-2', entryPrice: 100, exitPrice: 80, currentPrice: 80, closedAt: '2026-03-01' }
    const curve = buildEquityCurve([loss, baseTrade])

    expect(curve.map((point) => point.date)).toEqual(['2024-01-01', '2026-02-01', '2026-03-01'])
    expect(curve.at(-1)?.value).toBe(99_900)
    expect(curve.at(-1)?.drawdown).toBeLessThan(0)
  })
})

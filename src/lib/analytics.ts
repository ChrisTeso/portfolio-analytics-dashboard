import type { EnrichedTrade, EquityPoint, MonthlyReturn, PortfolioMetrics, Trade } from '../types'

const STARTING_CAPITAL = 100_000

export function enrichTrade(trade: Trade): EnrichedTrade {
  const exit = trade.exitPrice ?? trade.currentPrice
  const direction = trade.side === 'Short' ? -1 : 1
  const pnl = (exit - trade.entryPrice) * trade.quantity * trade.multiplier * direction
  const basis = trade.entryPrice * trade.quantity * trade.multiplier

  return {
    ...trade,
    isOpen: trade.closedAt === null,
    pnl,
    pnlPercent: basis === 0 ? 0 : (pnl / basis) * 100,
    marketValue: trade.currentPrice * trade.quantity * trade.multiplier,
  }
}

export function filterTrades(trades: Trade[], account: 'All' | Trade['account'], since: string | null) {
  return trades.filter((trade) => {
    if (account !== 'All' && trade.account !== account) return false
    if (since && (trade.closedAt ?? trade.openedAt) < since) return false
    return true
  })
}

export function buildMetrics(trades: Trade[]): PortfolioMetrics {
  const enriched = trades.map(enrichTrade)
  const closed = enriched.filter((trade) => !trade.isOpen)
  const winners = closed.filter((trade) => trade.pnl > 0)
  const grossProfit = closed.reduce((sum, trade) => sum + Math.max(trade.pnl, 0), 0)
  const grossLoss = Math.abs(closed.reduce((sum, trade) => sum + Math.min(trade.pnl, 0), 0))
  const equity = buildEquityCurve(trades)

  return {
    totalPnl: enriched.reduce((sum, trade) => sum + trade.pnl, 0),
    realizedPnl: closed.reduce((sum, trade) => sum + trade.pnl, 0),
    unrealizedPnl: enriched.filter((trade) => trade.isOpen).reduce((sum, trade) => sum + trade.pnl, 0),
    capitalDeployed: enriched.filter((trade) => trade.isOpen).reduce((sum, trade) => sum + Math.abs(trade.entryPrice * trade.quantity * trade.multiplier), 0),
    winRate: closed.length ? (winners.length / closed.length) * 100 : 0,
    profitFactor: grossLoss ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
    maxDrawdown: Math.min(...equity.map((point) => point.drawdown), 0),
    closedTrades: closed.length,
  }
}

export function buildEquityCurve(trades: Trade[]): EquityPoint[] {
  const events = trades
    .map(enrichTrade)
    .map((trade) => ({ date: trade.closedAt ?? trade.openedAt, pnl: trade.pnl }))
    .sort((a, b) => a.date.localeCompare(b.date))

  let value = STARTING_CAPITAL
  let peak = value
  const points: EquityPoint[] = [{ date: '2024-01-01', value, drawdown: 0 }]

  for (const event of events) {
    value += event.pnl
    peak = Math.max(peak, value)
    points.push({
      date: event.date,
      value,
      drawdown: peak === 0 ? 0 : ((value - peak) / peak) * 100,
    })
  }

  return points
}

export function buildMonthlyReturns(trades: Trade[]): MonthlyReturn[] {
  const months = new Map<string, number>()

  for (const trade of trades.map(enrichTrade)) {
    const month = (trade.closedAt ?? trade.openedAt).slice(0, 7)
    months.set(month, (months.get(month) ?? 0) + trade.pnl)
  }

  return [...months.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([month, pnl]) => ({ month, pnl }))
}

export function buildAllocation(trades: Trade[]) {
  const open = trades.map(enrichTrade).filter((trade) => trade.isOpen)
  const bySector = new Map<string, number>()

  for (const trade of open) {
    bySector.set(trade.sector, (bySector.get(trade.sector) ?? 0) + Math.abs(trade.marketValue))
  }

  const total = [...bySector.values()].reduce((sum, value) => sum + value, 0)
  return [...bySector.entries()]
    .map(([name, value]) => ({ name, value, share: total ? (value / total) * 100 : 0 }))
    .sort((left, right) => right.value - left.value)
}

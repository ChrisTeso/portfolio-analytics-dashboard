export type AssetClass = 'Equity' | 'ETF' | 'Future'
export type Account = 'Core' | 'Tactical'
export type Side = 'Long' | 'Short'

export interface Trade {
  id: string
  symbol: string
  company: string
  sector: string
  assetClass: AssetClass
  account: Account
  side: Side
  quantity: number
  multiplier: number
  entryPrice: number
  exitPrice: number | null
  currentPrice: number
  openedAt: string
  closedAt: string | null
}

export interface EnrichedTrade extends Trade {
  isOpen: boolean
  pnl: number
  pnlPercent: number
  marketValue: number
}

export interface EquityPoint {
  date: string
  value: number
  drawdown: number
}

export interface MonthlyReturn {
  month: string
  pnl: number
}

export interface PortfolioMetrics {
  totalPnl: number
  realizedPnl: number
  unrealizedPnl: number
  capitalDeployed: number
  winRate: number
  profitFactor: number
  maxDrawdown: number
  closedTrades: number
}
